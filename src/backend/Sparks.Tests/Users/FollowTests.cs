using System.Net;
using FluentAssertions;
using Sparks.Api.Activity.Models;
using Sparks.Api.Common.Models;
using Sparks.Api.Posts.Models;
using Sparks.Api.Realtime;
using Sparks.Api.Users.Data;
using Sparks.Api.Users.Models;
using Sparks.Tests.Infrastructure;

namespace Sparks.Tests.Users;

/// <summary>Following members: the follow itself, the lists, the Following feed, suggestions and activity.</summary>
public sealed class FollowTests(SparksApiFactory factory)
{
    private const string UsersPath = "/api/v1/users";

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task A_follow_shows_on_both_profiles_and_repeating_it_changes_nothing()
    {
        var (me, myself) = await factory.SignedInClientAsync(Ct);
        var (them, they) = await factory.SignedInClientAsync(Ct);

        var first = await FollowAsync(me, they.Username);
        var second = await FollowAsync(me, they.Username);

        first.Should().Be(new FollowState(Following: true, FollowerCount: 1));
        second.Should().Be(first);
        (await me.GetJsonAsync<ProfileResponse>($"{UsersPath}/{they.Username}", Ct)).Should().BeEquivalentTo(new
        {
            FollowerCount = 1,
            FollowingCount = 0,
            FollowedByMe = true,
            FollowsMe = false,
        });
        (await them.GetJsonAsync<ProfileResponse>($"{UsersPath}/{myself.Username}", Ct)).Should().BeEquivalentTo(new
        {
            FollowerCount = 0,
            FollowingCount = 1,
            FollowedByMe = false,
            FollowsMe = true,
        });
        (await factory.CreateClient().GetJsonAsync<ProfileResponse>($"{UsersPath}/{they.Username}", Ct))
            .Should().BeEquivalentTo(new { FollowerCount = 1, FollowedByMe = false, FollowsMe = false });
    }

    [Fact]
    public async Task Unfollowing_ends_the_follow_and_repeating_it_changes_nothing()
    {
        var (me, _) = await factory.SignedInClientAsync(Ct);
        var (_, they) = await factory.SignedInClientAsync(Ct);
        await FollowAsync(me, they.Username);

        var first = await UnfollowAsync(me, they.Username);
        var second = await UnfollowAsync(me, they.Username);

        first.Should().Be(new FollowState(Following: false, FollowerCount: 0));
        second.Should().Be(first);
    }

    [Fact]
    public async Task A_member_cannot_follow_themself()
    {
        var (me, myself) = await factory.SignedInClientAsync(Ct);

        var response = await me.PutAsync($"{UsersPath}/{myself.Username}/follow", content: null, Ct);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await response.ProblemCodeAsync(Ct)).Should().Be("CANNOT_FOLLOW_YOURSELF");
    }

    [Fact]
    public async Task A_guest_has_no_following_feed()
    {
        // The feed itself is public; only its Following filter needs a member.
        var feed = await factory.CreateClient().GetAsync("/api/v1/posts?following=true", Ct);
        var top = await factory.CreateClient().GetAsync("/api/v1/posts/top?following=true", Ct);

        foreach (var response in new[] { feed, top })
        {
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
            (await response.ProblemCodeAsync(Ct)).Should().Be("SIGN_IN_REQUIRED");
        }
    }

    [Fact]
    public async Task Follower_and_following_lists_put_the_latest_first_and_page()
    {
        var (_, star) = await factory.SignedInClientAsync(Ct);
        var fans = new List<(HttpClient Client, string Username)>();
        for (var i = 0; i < 3; i++)
        {
            var (fan, fanUser) = await factory.SignedInClientAsync(Ct);
            await FollowAsync(fan, star.Username);
            fans.Add((fan, fanUser.Username));
        }

        // The first fan also follows the third, to see FollowedByMe in a list.
        await FollowAsync(fans[0].Client, fans[2].Username);
        var viewer = fans[0].Client;

        var first = await viewer.GetJsonAsync<OpaqueCursorPage<MemberResponse>>(
            $"{UsersPath}/{star.Username}/followers?limit=2", Ct);
        var rest = await viewer.GetJsonAsync<OpaqueCursorPage<MemberResponse>>(
            $"{UsersPath}/{star.Username}/followers?limit=2&cursor={first.NextCursor}", Ct);
        var following = await viewer.GetJsonAsync<OpaqueCursorPage<MemberResponse>>(
            $"{UsersPath}/{fans[0].Username}/following", Ct);

        first.Items.Select(member => member.Username).Should().Equal(fans[2].Username, fans[1].Username);
        first.Items[0].FollowedByMe.Should().BeTrue();
        first.Items[1].FollowedByMe.Should().BeFalse();
        rest.Items.Select(member => member.Username).Should().Equal(fans[0].Username);
        rest.NextCursor.Should().BeNull();
        following.Items.Select(member => member.Username).Should().Equal(fans[2].Username, star.Username);
    }

    [Fact]
    public async Task The_following_feed_has_followed_members_sparks_and_mine()
    {
        var (me, _) = await factory.SignedInClientAsync(Ct);
        var (followed, followedUser) = await factory.SignedInClientAsync(Ct);
        var (stranger, _) = await factory.SignedInClientAsync(Ct);
        var theirs = await followed.CreatePostAsync("From someone I follow", Ct);
        await stranger.CreatePostAsync("From a stranger", Ct);
        var mine = await me.CreatePostAsync("My own", Ct);
        await FollowAsync(me, followedUser.Username);
        await followed.PutAsync($"/api/v1/posts/{theirs.Id}/like", content: null, Ct);

        var feed = await me.GetJsonAsync<CursorPage<PostResponse>>("/api/v1/posts?following=true", Ct);
        var top = await me.GetJsonAsync<OpaqueCursorPage<PostResponse>>("/api/v1/posts/top?following=true", Ct);

        feed.Items.Select(post => post.Id).Should().Equal(mine.Id, theirs.Id);
        top.Items.Select(post => post.Id).Should().Equal(theirs.Id, mine.Id);
    }

    [Fact]
    public async Task Suggestions_are_members_with_sparks_I_dont_follow_yet()
    {
        var (me, myself) = await factory.SignedInClientAsync(Ct);
        await me.CreatePostAsync("Mine", Ct);
        var (followed, followedUser) = await factory.SignedInClientAsync(Ct);
        await followed.CreatePostAsync("Already followed", Ct);
        await FollowAsync(me, followedUser.Username);
        var (popular, popularUser) = await factory.SignedInClientAsync(Ct);
        await popular.CreatePostAsync("Worth following", Ct);
        var (_, silentUser) = await factory.SignedInClientAsync(Ct);
        for (var i = 0; i < 2; i++)
        {
            var (fan, _) = await factory.SignedInClientAsync(Ct);
            await FollowAsync(fan, popularUser.Username);
            await FollowAsync(fan, silentUser.Username);
        }

        var suggestions = await me.GetJsonAsync<List<MemberResponse>>($"{UsersPath}/me/suggestions?limit=20", Ct);

        suggestions.Should().Contain(member => member.Id == popularUser.Id);
        suggestions.Should().NotContain(member =>
            member.Id == myself.Id || member.Id == followedUser.Id || member.Id == silentUser.Id);
        suggestions.Should().OnlyContain(member => !member.FollowedByMe);
    }

    [Fact]
    public async Task New_followers_show_in_activity_folded_by_day()
    {
        var (me, myself) = await factory.SignedInClientAsync(Ct);
        var (first, firstUser) = await factory.SignedInClientAsync(Ct);
        var (second, secondUser) = await factory.SignedInClientAsync(Ct);
        var (_, earlierUser) = await factory.SignedInClientAsync(Ct);
        await using (var db = factory.CreateDbContext())
        {
            db.Follows.Add(new FollowEntity
            {
                FollowerId = earlierUser.Id,
                FolloweeId = myself.Id,
                CreatedAt = DateTime.UtcNow.AddDays(-3),
            });
            await db.SaveChangesAsync(Ct);
        }

        await FollowAsync(first, myself.Username);
        await FollowAsync(second, myself.Username);

        var activity = await me.GetJsonAsync<OpaqueCursorPage<ActivityItem>>("/api/v1/activity?filter=follows", Ct);
        var unread = await me.GetJsonAsync<UnreadActivity>("/api/v1/activity/unread-count", Ct);

        activity.Items.Should().SatisfyRespectively(
            today => today.Should().BeEquivalentTo(new
            {
                Kind = ActivityKind.Follow,
                Actors = new[] { new { secondUser.Username }, new { firstUser.Username } },
                Count = 2,
                PostId = (long?)null,
                CommentId = (long?)null,
                Excerpt = (string?)null,
                Unread = true,
            }),
            earlier => earlier.Should().BeEquivalentTo(new
            {
                Kind = ActivityKind.Follow,
                Actors = new[] { new { earlierUser.Username } },
                Count = 1,
            }));
        activity.Items[0].Actors.Select(actor => actor.Username).Should().Equal(
            [secondUser.Username, firstUser.Username], "the latest follower comes first");
        unread.Count.Should().Be(3);

        await UnfollowAsync(first, myself.Username);
        var after = await me.GetJsonAsync<OpaqueCursorPage<ActivityItem>>("/api/v1/activity?filter=follows", Ct);
        after.Items[0].Should().BeEquivalentTo(new { Count = 1, Actors = new[] { new { secondUser.Username } } });
    }

    [Fact]
    public async Task A_new_follower_arrives_live()
    {
        var (_, myself, myToken) = await factory.SignedInWithTokenAsync(Ct);
        var (fan, fanUser) = await factory.SignedInClientAsync(Ct);
        await using var live = await factory.ConnectLiveAsync(myToken, Ct);
        var followed = live.NextAsync<ActivityNotice>(nameof(IRealtimeClient.ActivityReceived), Ct);

        await FollowAsync(fan, myself.Username);

        (await followed).Should().BeEquivalentTo(new
        {
            Kind = ActivityKind.Follow,
            Actor = new { fanUser.Username },
            PostId = (long?)null,
            Excerpt = (string?)null,
        });
    }

    private static async Task<FollowState> FollowAsync(HttpClient client, string username)
    {
        var response = await client.PutAsync($"{UsersPath}/{username}/follow", content: null, Ct);
        response.EnsureSuccessStatusCode();
        return await response.ReadAsync<FollowState>(Ct);
    }

    private static async Task<FollowState> UnfollowAsync(HttpClient client, string username)
    {
        var response = await client.DeleteAsync($"{UsersPath}/{username}/follow", Ct);
        response.EnsureSuccessStatusCode();
        return await response.ReadAsync<FollowState>(Ct);
    }
}
