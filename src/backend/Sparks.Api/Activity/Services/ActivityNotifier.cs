using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Sparks.Api.Activity.Models;
using Sparks.Api.Common.Data;
using Sparks.Api.Realtime;
using Sparks.Api.Storage;
using Sparks.Api.Users.Models;

namespace Sparks.Api.Activity.Services;

/// <summary>
/// Pushes new activity to the member it's about, so their badge and activity
/// page update without a reload. The write it follows is already saved, so a
/// failure here is logged and nothing more.
/// </summary>
public sealed class ActivityNotifier(
    SparksDbContext db,
    IHubContext<RealtimeHub, IRealtimeClient> hub,
    ILogger<ActivityNotifier> logger)
{
    private const int ExcerptLength = 140;

    public Task PostLikedAsync(long postId, long likerId, CancellationToken ct) =>
        TryAsync(async () =>
        {
            var post = await db.Posts.AsNoTracking()
                .Where(post => post.Id == postId)
                .Select(post => new { post.AuthorId, Excerpt = post.Body.Substring(0, ExcerptLength) })
                .SingleOrDefaultAsync(ct);
            if (post is not null && post.AuthorId != likerId)
            {
                await SendAsync(post.AuthorId, ActivityKind.PostLike, likerId, postId, commentId: null, post.Excerpt, ct);
            }
        });

    public Task CommentLikedAsync(long commentId, long likerId, CancellationToken ct) =>
        TryAsync(async () =>
        {
            var comment = await db.Comments.AsNoTracking()
                .Where(comment => comment.Id == commentId)
                .Select(comment => new { comment.AuthorId, comment.PostId, Excerpt = comment.Body.Substring(0, ExcerptLength) })
                .SingleOrDefaultAsync(ct);
            if (comment is not null && comment.AuthorId != likerId)
            {
                await SendAsync(comment.AuthorId, ActivityKind.CommentLike, likerId, comment.PostId, commentId, comment.Excerpt, ct);
            }
        });

    /// <summary>
    /// A new comment or reply. The parent's author hears of a reply; the
    /// post's author hears of anything else on their post, as activity does.
    /// </summary>
    public Task CommentedAsync(long commentId, CancellationToken ct) =>
        TryAsync(async () =>
        {
            var comment = await db.Comments.AsNoTracking()
                .Where(comment => comment.Id == commentId)
                .Select(comment => new
                {
                    comment.AuthorId,
                    comment.PostId,
                    PostAuthorId = comment.Post.AuthorId,
                    ParentAuthorId = comment.ParentComment == null ? (long?)null : comment.ParentComment.AuthorId,
                    Excerpt = comment.Body.Substring(0, ExcerptLength),
                })
                .SingleOrDefaultAsync(ct);
            if (comment is null)
            {
                return;
            }

            if (comment.ParentAuthorId is { } parentAuthorId && parentAuthorId != comment.AuthorId)
            {
                await SendAsync(parentAuthorId, ActivityKind.Reply, comment.AuthorId, comment.PostId, commentId, comment.Excerpt, ct);
            }

            if (comment.PostAuthorId != comment.AuthorId && comment.PostAuthorId != comment.ParentAuthorId)
            {
                await SendAsync(comment.PostAuthorId, ActivityKind.Comment, comment.AuthorId, comment.PostId, commentId, comment.Excerpt, ct);
            }
        });

    public Task FollowedAsync(long followerId, long followeeId, CancellationToken ct) =>
        TryAsync(() => SendAsync(followeeId, ActivityKind.Follow, followerId, postId: null, commentId: null, excerpt: null, ct));

    private async Task SendAsync(
        long recipientId, ActivityKind kind, long actorId, long? postId, long? commentId, string? excerpt, CancellationToken ct)
    {
        var actor = await db.Users.AsNoTracking()
            .Where(user => user.Id == actorId)
            .Select(user => new UserSummary(user.Id, user.Username, user.DisplayName, FileUrls.Of(user.AvatarKey)))
            .SingleAsync(ct);
        await hub.Clients.Member(recipientId).ActivityReceived(new ActivityNotice(kind, actor, postId, commentId, excerpt));
    }

    private async Task TryAsync(Func<Task> notify)
    {
        try
        {
            await notify();
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Couldn't push new activity");
        }
    }
}
