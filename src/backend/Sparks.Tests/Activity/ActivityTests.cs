using System.Net;
using FluentAssertions;
using Sparks.Api.Activity.Models;
using Sparks.Api.Posts.Models;
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

        var activity = await me.GetJsonAsync<ActivityPage>(ActivityPath, Ct);

        activity.Items.Should().SatisfyRespectively(
            item => item.Should().BeEquivalentTo(new
            {
                Kind = ActivityKind.Comment,
                Actor = new { thirdUser.Username },
                PostId = myPost.Id,
                CommentId = (long?)replyOnMyPost.Id,
                Excerpt = "A reply on my post",
            }),
            item => item.Should().BeEquivalentTo(new
            {
                Kind = ActivityKind.CommentLike,
                Actor = new { otherUser.Username },
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
        var post = await me.CreatePostAsync("Popular", Ct);
        for (var i = 0; i < 3; i++)
        {
            var (fan, _) = await factory.SignedInClientAsync(Ct);
            await LikePostAsync(fan, post.Id);
        }

        var before = await UnreadCountAsync(me);
        var seen = await me.GetJsonAsync<ActivityPage>(ActivityPath, Ct);
        await MarkReadAsync(me, seen.Items[1].At);
        var afterMarking = await me.GetJsonAsync<ActivityPage>(ActivityPath, Ct);
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
        var post = await me.CreatePostAsync("Busy", Ct);
        for (var i = 0; i < 3; i++)
        {
            var (fan, _) = await factory.SignedInClientAsync(Ct);
            await LikePostAsync(fan, post.Id);
        }

        var first = await me.GetJsonAsync<ActivityPage>($"{ActivityPath}?limit=2", Ct);
        var second = await me.GetJsonAsync<ActivityPage>(
            $"{ActivityPath}?limit=2&cursor={Uri.EscapeDataString(first.NextCursor!)}", Ct);
        var forged = await me.GetAsync($"{ActivityPath}?cursor=not-a-cursor", Ct);

        first.Items.Should().HaveCount(2);
        second.Items.Should().ContainSingle().Which.At.Should().BeBefore(first.Items[^1].At);
        second.NextCursor.Should().BeNull();
        forged.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await forged.ProblemCodeAsync(Ct)).Should().Be("INVALID_CURSOR");
    }

    [Fact]
    public async Task An_unlike_takes_the_like_out_of_activity()
    {
        var (me, _) = await factory.SignedInClientAsync(Ct);
        var (fan, _) = await factory.SignedInClientAsync(Ct);
        var post = await me.CreatePostAsync("Fickle", Ct);

        await LikePostAsync(fan, post.Id);
        await fan.DeleteAsync($"/api/v1/posts/{post.Id}/like", Ct);

        (await me.GetJsonAsync<ActivityPage>(ActivityPath, Ct)).Items.Should().BeEmpty();
        (await UnreadCountAsync(me)).Should().Be(0);
    }

    [Theory]
    [InlineData("GET", "")]
    [InlineData("GET", "/unread-count")]
    [InlineData("POST", "/read")]
    public async Task Activity_requires_sign_in(string method, string path)
    {
        var response = await factory.CreateClient().SendAsync(
            new HttpRequestMessage(new HttpMethod(method), ActivityPath + path), Ct);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    private static async Task LikePostAsync(HttpClient client, long postId) =>
        (await client.PutAsync($"/api/v1/posts/{postId}/like", content: null, Ct)).EnsureSuccessStatusCode();

    private static async Task<int> UnreadCountAsync(HttpClient client) =>
        (await client.GetJsonAsync<UnreadActivity>($"{ActivityPath}/unread-count", Ct)).Count;

    private static async Task MarkReadAsync(HttpClient client, DateTime upTo) =>
        (await client.PostJsonAsync($"{ActivityPath}/read", new MarkActivityReadRequest { UpTo = upTo }, Ct))
            .EnsureSuccessStatusCode();
}
