using System.Net;
using FluentAssertions;
using Sparks.Api.Activity.Models;
using Sparks.Api.Common.Models;
using Sparks.Api.Realtime;
using Sparks.Tests.Infrastructure;

namespace Sparks.Tests.Activity;

/// <summary>What others do to a member's posts and comments, and what's unread.</summary>
public sealed class ActivityTests(SparksApiFactory factory)
{
    private const string ActivityPath = "/api/v1/activity";

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Activity_lists_what_others_did_to_my_content_newest_first()
    {
        var (me, _) = await factory.SignedInClientAsync(Ct);
        var (other, otherUser) = await factory.SignedInClientAsync(Ct);
        var (third, thirdUser) = await factory.SignedInClientAsync(Ct);
        var myPost = await me.CreatePostAsync("My spark", Ct);
        var othersPost = await other.CreatePostAsync("Their spark", Ct);
        var myComment = await me.CommentAsync(othersPost.Id, "My comment", Ct);

        await LikePostAsync(other, myPost.Id);
        var otherComment = await other.CommentAsync(myPost.Id, "Their comment on mine", Ct);
        var reply = await other.ReplyAsync(myComment.Id, "Their reply to me", Ct);
        await other.PutAsync($"/api/v1/comments/{myComment.Id}/like", content: null, Ct);
        var replyOnMyPost = await third.ReplyAsync(otherComment.Id, "A reply on my post", Ct);
        await LikePostAsync(me, myPost.Id);
        await me.CommentAsync(myPost.Id, "Talking to myself", Ct);

        var activity = await me.GetJsonAsync<OpaqueCursorPage<ActivityItem>>(ActivityPath, Ct);

        activity.Items.Should().SatisfyRespectively(
            item => item.Should().BeEquivalentTo(new
            {
                Kind = ActivityKind.Comment,
                Actors = new[] { new { thirdUser.Username } },
                PostId = myPost.Id,
                CommentId = (long?)replyOnMyPost.Id,
                Excerpt = "A reply on my post",
            }),
            item => item.Should().BeEquivalentTo(new
            {
                Kind = ActivityKind.CommentLike,
                Actors = new[] { new { otherUser.Username } },
                PostId = othersPost.Id,
                CommentId = (long?)myComment.Id,
                Excerpt = "My comment",
            }),
            item => item.Should().BeEquivalentTo(new
            {
                Kind = ActivityKind.Reply,
                PostId = othersPost.Id,
                CommentId = (long?)reply.Id,
                Excerpt = "Their reply to me",
            }),
            item => item.Should().BeEquivalentTo(new
            {
                Kind = ActivityKind.Comment,
                CommentId = (long?)otherComment.Id,
                Excerpt = "Their comment on mine",
            }),
            item => item.Should().BeEquivalentTo(new
            {
                Kind = ActivityKind.PostLike,
                PostId = myPost.Id,
                CommentId = (long?)null,
                Excerpt = "My spark",
            }));
        activity.Items.Should().OnlyContain(item => item.Unread);
        activity.NextCursor.Should().BeNull();
    }

    [Fact]
    public async Task Marking_read_counts_only_later_activity_as_unread()
    {
        var (me, _) = await factory.SignedInClientAsync(Ct);
        for (var i = 0; i < 3; i++)
        {
            var post = await me.CreatePostAsync($"Popular {i}", Ct);
            var (fan, _) = await factory.SignedInClientAsync(Ct);
            await LikePostAsync(fan, post.Id);
        }

        var before = await UnreadCountAsync(me);
        var seen = await me.GetJsonAsync<OpaqueCursorPage<ActivityItem>>(ActivityPath, Ct);
        await MarkReadAsync(me, seen.Items[1].At);
        var afterMarking = await me.GetJsonAsync<OpaqueCursorPage<ActivityItem>>(ActivityPath, Ct);
        await MarkReadAsync(me, seen.Items[2].At);

        before.Should().Be(3);
        afterMarking.Items.Select(item => item.Unread).Should().Equal(true, false, false);
        (await UnreadCountAsync(me)).Should().Be(1, "marking an earlier point never makes seen items unread again");
    }

    [Fact]
    public async Task Marking_read_with_a_future_time_doesnt_hide_later_activity()
    {
        var (me, _) = await factory.SignedInClientAsync(Ct);
        var (fan, _) = await factory.SignedInClientAsync(Ct);
        var post = await me.CreatePostAsync("Still listening", Ct);

        await MarkReadAsync(me, DateTime.UtcNow.AddDays(1));
        await LikePostAsync(fan, post.Id);

        (await UnreadCountAsync(me)).Should().Be(1);
    }

    [Fact]
    public async Task Activity_pages_with_an_opaque_cursor()
    {
        var (me, _) = await factory.SignedInClientAsync(Ct);
        for (var i = 0; i < 3; i++)
        {
            var post = await me.CreatePostAsync($"Busy {i}", Ct);
            var (fan, _) = await factory.SignedInClientAsync(Ct);
            await LikePostAsync(fan, post.Id);
        }

        var first = await me.GetJsonAsync<OpaqueCursorPage<ActivityItem>>($"{ActivityPath}?limit=2", Ct);
        var second = await me.GetJsonAsync<OpaqueCursorPage<ActivityItem>>(
            $"{ActivityPath}?limit=2&cursor={Uri.EscapeDataString(first.NextCursor!)}", Ct);
        var forged = await me.GetAsync($"{ActivityPath}?cursor=not-a-cursor", Ct);

        first.Items.Should().HaveCount(2);
        second.Items.Should().ContainSingle().Which.At.Should().BeBefore(first.Items[^1].At);
        second.NextCursor.Should().BeNull();
        forged.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await forged.ProblemCodeAsync(Ct)).Should().Be("INVALID_CURSOR");
    }

    [Fact]
    public async Task Likes_on_one_spark_fold_into_one_item_with_the_latest_likers_first()
    {
        var (me, _) = await factory.SignedInClientAsync(Ct);
        var post = await me.CreatePostAsync("Crowd pleaser", Ct);
        List<string> likers = [];
        for (var i = 0; i < 4; i++)
        {
            var (fan, fanUser) = await factory.SignedInClientAsync(Ct);
            await LikePostAsync(fan, post.Id);
            likers.Add(fanUser.Username);
        }

        var activity = await me.GetJsonAsync<OpaqueCursorPage<ActivityItem>>(ActivityPath, Ct);

        var item = activity.Items.Should().ContainSingle().Subject;
        item.Kind.Should().Be(ActivityKind.PostLike);
        item.Count.Should().Be(4);
        item.Actors.Select(actor => actor.Username).Should().Equal(likers[3], likers[2], likers[1]);
        (await UnreadCountAsync(me)).Should().Be(4, "the badge counts every like");
    }

    [Theory]
    [InlineData("likes", ActivityKind.PostLike)]
    [InlineData("comments", ActivityKind.Comment)]
    [InlineData("replies", ActivityKind.Reply)]
    public async Task Activity_filters_by_kind(string filter, ActivityKind expected)
    {
        var (me, _) = await factory.SignedInClientAsync(Ct);
        var (other, _) = await factory.SignedInClientAsync(Ct);
        var myPost = await me.CreatePostAsync("Mine", Ct);
        var myComment = await me.CommentAsync(myPost.Id, "Mine too", Ct);
        await LikePostAsync(other, myPost.Id);
        await other.CommentAsync(myPost.Id, "A comment", Ct);
        await other.ReplyAsync(myComment.Id, "A reply", Ct);

        var activity = await me.GetJsonAsync<OpaqueCursorPage<ActivityItem>>($"{ActivityPath}?filter={filter}", Ct);

        activity.Items.Should().ContainSingle().Which.Kind.Should().Be(expected);
    }

    [Fact]
    public async Task New_activity_is_pushed_live_to_the_member_its_about_but_not_their_own()
    {
        var (me, _, myToken) = await factory.SignedInWithTokenAsync(Ct);
        var (fan, fanUser) = await factory.SignedInClientAsync(Ct);
        var post = await me.CreatePostAsync("Watch this", Ct);
        await using var live = await factory.ConnectLiveAsync(myToken, Ct);
        var first = live.NextAsync<ActivityNotice>(nameof(IRealtimeClient.ActivityReceived), Ct);
        var commented = live.NextAsync<ActivityNotice>(
            nameof(IRealtimeClient.ActivityReceived), Ct, notice => notice.Kind == ActivityKind.Comment);

        // My own like goes first: had it been pushed, it would be the first notice.
        await LikePostAsync(me, post.Id);
        await LikePostAsync(fan, post.Id);
        await fan.CommentAsync(post.Id, "Nice one", Ct);

        (await first).Should().BeEquivalentTo(new
        {
            Kind = ActivityKind.PostLike,
            Actor = new { fanUser.Username },
            PostId = post.Id,
            Excerpt = "Watch this",
        });
        (await commented).Excerpt.Should().Be("Nice one");
    }

    [Fact]
    public async Task An_unlike_takes_the_like_out_of_activity()
    {
        var (me, _) = await factory.SignedInClientAsync(Ct);
        var (fan, _) = await factory.SignedInClientAsync(Ct);
        var post = await me.CreatePostAsync("Fickle", Ct);

        await LikePostAsync(fan, post.Id);
        await fan.DeleteAsync($"/api/v1/posts/{post.Id}/like", Ct);

        (await me.GetJsonAsync<OpaqueCursorPage<ActivityItem>>(ActivityPath, Ct)).Items.Should().BeEmpty();
        (await UnreadCountAsync(me)).Should().Be(0);
    }

    private static async Task LikePostAsync(HttpClient client, long postId) =>
        (await client.PutAsync($"/api/v1/posts/{postId}/like", content: null, Ct)).EnsureSuccessStatusCode();

    private static async Task<int> UnreadCountAsync(HttpClient client) =>
        (await client.GetJsonAsync<UnreadActivity>($"{ActivityPath}/unread-count", Ct)).Count;

    private static async Task MarkReadAsync(HttpClient client, DateTime upTo) =>
        (await client.PostJsonAsync($"{ActivityPath}/read", new MarkActivityReadRequest { UpTo = upTo }, Ct))
            .EnsureSuccessStatusCode();
}
