using System.Net;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Sparks.Api.Common.Models;
using Sparks.Api.Posts.Models;
using Sparks.Tests.Infrastructure;

namespace Sparks.Tests.Posts;

/// <summary>Threads: comments on posts, replies to comments, and who may change them.</summary>
public sealed class CommentTests(SparksApiFactory factory)
{
    private const string PostsPath = "/api/v1/posts";
    private const string CommentsPath = "/api/v1/comments";

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Anyone_can_read_a_thread_oldest_first_with_replies_under_their_comment()
    {
        var (author, _) = await factory.SignedInClientAsync(Ct);
        var post = await author.CreatePostAsync("Start a thread", Ct);
        var first = await author.CommentAsync(post.Id, "First", Ct);
        var second = await author.CommentAsync(post.Id, "Second", Ct);
        var reply = await author.ReplyAsync(first.Id, "Answering the first", Ct);

        var reader = factory.CreateClient();
        var thread = await reader.GetJsonAsync<CursorPage<CommentResponse>>($"{PostsPath}/{post.Id}/comments", Ct);
        var replies = await reader.GetJsonAsync<CursorPage<CommentResponse>>($"{CommentsPath}/{first.Id}/replies", Ct);
        var postNow = await reader.GetJsonAsync<PostResponse>($"{PostsPath}/{post.Id}", Ct);

        thread.Items.Select(comment => comment.Id).Should().Equal(first.Id, second.Id);
        thread.Items[0].ReplyCount.Should().Be(1);
        replies.Items.Should().ContainSingle().Which.Should().BeEquivalentTo(
            new { reply.Id, PostId = post.Id, ParentCommentId = (long?)first.Id, Body = "Answering the first" });
        postNow.CommentCount.Should().Be(3, "the count covers replies too");
    }

    [Fact]
    public async Task A_spark_brings_its_most_liked_comment_for_lists()
    {
        var (author, _) = await factory.SignedInClientAsync(Ct);
        var (fan, fanUser) = await factory.SignedInClientAsync(Ct);
        var post = await author.CreatePostAsync("Which line works best?", Ct);
        var before = await factory.CreateClient().GetJsonAsync<PostResponse>($"/api/v1/posts/{post.Id}", Ct);
        var first = await author.CommentAsync(post.Id, "The first one.", Ct);
        var liked = await fan.CommentAsync(post.Id, new string('x', 300), Ct);
        var reply = await author.ReplyAsync(first.Id, "Replies never count.", Ct);
        await fan.PutAsync($"{CommentsPath}/{reply.Id}/like", content: null, Ct);
        await author.PutAsync($"{CommentsPath}/{reply.Id}/like", content: null, Ct);

        var earliest = await factory.CreateClient().GetJsonAsync<PostResponse>($"/api/v1/posts/{post.Id}", Ct);
        await author.PutAsync($"{CommentsPath}/{liked.Id}/like", content: null, Ct);
        var mostLiked = await factory.CreateClient().GetJsonAsync<PostResponse>($"/api/v1/posts/{post.Id}", Ct);

        before.TopComment.Should().BeNull();
        earliest.TopComment!.Id.Should().Be(first.Id, "with no likes on top-level comments, the earliest leads");
        mostLiked.TopComment.Should().BeEquivalentTo(new
        {
            liked.Id,
            Body = new string('x', CommentPreview.ExcerptLength),
            Author = new { fanUser.Id, fanUser.Username },
        });
    }

    [Fact]
    public async Task A_thread_pages_with_a_cursor()
    {
        var (author, _) = await factory.SignedInClientAsync(Ct);
        var post = await author.CreatePostAsync("A busy thread", Ct);
        for (var i = 0; i < 3; i++)
        {
            await author.CommentAsync(post.Id, $"Comment {i}", Ct);
        }

        var reader = factory.CreateClient();
        var path = $"{PostsPath}/{post.Id}/comments?limit=2";
        var first = await reader.GetJsonAsync<CursorPage<CommentResponse>>(path, Ct);
        var second = await reader.GetJsonAsync<CursorPage<CommentResponse>>($"{path}&cursor={first.NextCursor}", Ct);

        first.Items.Should().HaveCount(2);
        first.NextCursor.Should().Be(first.Items[^1].Id);
        second.Items.Should().ContainSingle().Which.Id.Should().BeGreaterThan(first.Items[^1].Id);
        second.NextCursor.Should().BeNull();
    }

    [Fact]
    public async Task Commenting_requires_sign_in()
    {
        var (author, _) = await factory.SignedInClientAsync(Ct);
        var post = await author.CreatePostAsync("Say something", Ct);
        var comment = await author.CommentAsync(post.Id, "I will", Ct);
        var anonymous = factory.CreateClient();

        var onPost = await anonymous.PostJsonAsync($"{PostsPath}/{post.Id}/comments", new CommentRequest { Body = "Hi" }, Ct);
        var onComment = await anonymous.PostJsonAsync($"{CommentsPath}/{comment.Id}/replies", new CommentRequest { Body = "Hi" }, Ct);

        onPost.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        onComment.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task A_new_comment_comes_back_with_its_author_and_location()
    {
        var (author, user) = await factory.SignedInClientAsync(Ct);
        var post = await author.CreatePostAsync("Comment on me", Ct);

        var response = await author.PostJsonAsync(
            $"{PostsPath}/{post.Id}/comments", new CommentRequest { Body = "  Nice one.  " }, Ct);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var comment = await response.ReadAsync<CommentResponse>(Ct);
        response.Headers.Location!.ToString().Should().EndWith($"{CommentsPath}/{comment.Id}");
        comment.Should().BeEquivalentTo(new
        {
            PostId = post.Id,
            ParentCommentId = (long?)null,
            Body = "Nice one.",
            LikeCount = 0,
            ReplyCount = 0,
            LikedByMe = false,
        });
        comment.Author.Username.Should().Be(user.Username);
    }

    [Fact]
    public async Task A_blank_comment_names_the_body_field()
    {
        var (author, _) = await factory.SignedInClientAsync(Ct);
        var post = await author.CreatePostAsync("Say something real", Ct);

        var response = await author.PostJsonAsync(
            $"{PostsPath}/{post.Id}/comments", new CommentRequest { Body = "   " }, Ct);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var problem = await response.ReadAsync<JsonElement>(Ct);
        problem.GetProperty("errors").EnumerateObject().Select(error => error.Name).Should().Contain("body");
    }

    [Fact]
    public async Task Missing_posts_and_comments_are_404s_with_a_code()
    {
        var (client, _) = await factory.SignedInClientAsync(Ct);
        var body = new CommentRequest { Body = "Hello?" };
        const long missing = long.MaxValue;

        var commentOnPost = await client.PostJsonAsync($"{PostsPath}/{missing}/comments", body, Ct);
        var readThread = await client.GetAsync($"{PostsPath}/{missing}/comments", Ct);
        var reply = await client.PostJsonAsync($"{CommentsPath}/{missing}/replies", body, Ct);
        var readReplies = await client.GetAsync($"{CommentsPath}/{missing}/replies", Ct);
        var like = await client.PutAsync($"{CommentsPath}/{missing}/like", content: null, Ct);

        foreach (var response in new[] { commentOnPost, readThread })
        {
            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
            (await response.ProblemCodeAsync(Ct)).Should().Be("POST_NOT_FOUND");
        }

        foreach (var response in new[] { reply, readReplies, like })
        {
            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
            (await response.ProblemCodeAsync(Ct)).Should().Be("COMMENT_NOT_FOUND");
        }
    }

    [Fact]
    public async Task Only_the_author_can_edit_or_delete_a_comment()
    {
        var (postAuthor, _) = await factory.SignedInClientAsync(Ct);
        var (commenter, _) = await factory.SignedInClientAsync(Ct);
        var post = await postAuthor.CreatePostAsync("My post", Ct);
        var comment = await commenter.CommentAsync(post.Id, "My comment", Ct);
        var path = $"{CommentsPath}/{comment.Id}";

        var postAuthorEdit = await postAuthor.PatchJsonAsync(path, new CommentRequest { Body = "Rewritten" }, Ct);
        var postAuthorDelete = await postAuthor.DeleteAsync(path, Ct);
        var commenterEdit = await commenter.PatchJsonAsync(path, new CommentRequest { Body = "Better said" }, Ct);

        postAuthorEdit.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await postAuthorEdit.ProblemCodeAsync(Ct)).Should().Be("NOT_YOUR_COMMENT");
        postAuthorDelete.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        var edited = await commenterEdit.ReadAsync<CommentResponse>(Ct);
        edited.Body.Should().Be("Better said");
        edited.EditedAt.Should().NotBeNull();

        (await commenter.DeleteAsync(path, Ct)).StatusCode.Should().Be(HttpStatusCode.NoContent);
        var gone = await factory.CreateClient().GetAsync(path, Ct);
        gone.StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await gone.ProblemCodeAsync(Ct)).Should().Be("COMMENT_NOT_FOUND");
    }

    [Fact]
    public async Task Deleting_a_comment_removes_every_reply_beneath_it_and_their_likes()
    {
        var (author, _) = await factory.SignedInClientAsync(Ct);
        var (other, _) = await factory.SignedInClientAsync(Ct);
        var post = await author.CreatePostAsync("A thread to prune", Ct);
        var top = await author.CommentAsync(post.Id, "Top", Ct);
        var reply = await other.ReplyAsync(top.Id, "Reply", Ct);
        var nested = await author.ReplyAsync(reply.Id, "Reply to the reply", Ct);
        var sibling = await other.CommentAsync(post.Id, "Unrelated", Ct);
        await other.PutAsync($"{CommentsPath}/{nested.Id}/like", content: null, Ct);

        var response = await author.DeleteAsync($"{CommentsPath}/{top.Id}", Ct);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        var thread = await author.GetJsonAsync<CursorPage<CommentResponse>>($"{PostsPath}/{post.Id}/comments", Ct);
        thread.Items.Select(comment => comment.Id).Should().Equal(sibling.Id);
        await using var db = factory.CreateDbContext();
        long[] removed = [top.Id, reply.Id, nested.Id];
        (await db.Comments.CountAsync(comment => removed.Contains(comment.Id), Ct)).Should().Be(0);
        (await db.CommentLikes.CountAsync(like => like.CommentId == nested.Id, Ct)).Should().Be(0);
    }

    [Fact]
    public async Task Deleting_a_post_removes_its_whole_thread()
    {
        var (author, _) = await factory.SignedInClientAsync(Ct);
        var (fan, _) = await factory.SignedInClientAsync(Ct);
        var post = await author.CreatePostAsync("Here today", Ct);
        var comment = await fan.CommentAsync(post.Id, "Love it", Ct);
        var reply = await author.ReplyAsync(comment.Id, "Thanks", Ct);
        await fan.PutAsync($"{CommentsPath}/{reply.Id}/like", content: null, Ct);

        var response = await author.DeleteAsync($"{PostsPath}/{post.Id}", Ct);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        await using var db = factory.CreateDbContext();
        (await db.Comments.CountAsync(c => c.PostId == post.Id, Ct)).Should().Be(0);
        (await db.CommentLikes.CountAsync(like => like.CommentId == reply.Id, Ct)).Should().Be(0);
    }

    [Fact]
    public async Task Comment_likes_count_once_per_user_and_show_to_whoever_liked()
    {
        var (author, _) = await factory.SignedInClientAsync(Ct);
        var (fan, _) = await factory.SignedInClientAsync(Ct);
        var post = await author.CreatePostAsync("Likeable", Ct);
        var comment = await author.CommentAsync(post.Id, "Like this comment", Ct);
        var likePath = $"{CommentsPath}/{comment.Id}/like";

        await fan.PutAsync(likePath, content: null, Ct);
        var secondLike = await (await fan.PutAsync(likePath, content: null, Ct)).ReadAsync<LikeState>(Ct);
        var seenByFan = await fan.GetJsonAsync<CommentResponse>($"{CommentsPath}/{comment.Id}", Ct);
        var seenByAnyone = await factory.CreateClient().GetJsonAsync<CommentResponse>($"{CommentsPath}/{comment.Id}", Ct);
        await fan.DeleteAsync(likePath, Ct);
        var afterUnlikes = await (await fan.DeleteAsync(likePath, Ct)).ReadAsync<LikeState>(Ct);

        secondLike.Should().Be(new LikeState(Liked: true, LikeCount: 1));
        seenByFan.LikedByMe.Should().BeTrue();
        seenByAnyone.LikedByMe.Should().BeFalse();
        seenByAnyone.LikeCount.Should().Be(1);
        afterUnlikes.Should().Be(new LikeState(Liked: false, LikeCount: 0));
    }
}
