using Microsoft.EntityFrameworkCore;
using Sparks.Api.Activity.Models;
using Sparks.Api.Common.Data;
using Sparks.Api.Common.Errors;
using Sparks.Api.Common.Models;
using Sparks.Api.Storage;
using Sparks.Api.Users.Models;

namespace Sparks.Api.Activity.Services;

/// <summary>
/// Likes, comments and replies on a member's posts and comments, newest first.
/// Queried from those tables rather than stored, so an unlike or a deleted
/// comment just disappears. Unread is anything after one per-member timestamp.
/// </summary>
public sealed class ActivityService(SparksDbContext db, TimeProvider time)
{
    /// <summary>How much of a post or comment an activity item quotes.</summary>
    private const int ExcerptLength = 140;

    public async Task<OpaqueCursorPage<ActivityItem>> GetAsync(long userId, OpaquePageRequest query, CancellationToken ct)
    {
        var rows = Rows(userId);
        if (query.Cursor is not null)
        {
            var after = ActivityCursor.Parse(query.Cursor)
                ?? throw ApiException.BadRequest("INVALID_CURSOR", "That cursor didn't come from this API.");

            // The rows after the cursor in the sort order below.
            rows = rows.Where(row =>
                row.At < after.At
                || (row.At == after.At && (row.Kind > after.Kind
                    || (row.Kind == after.Kind && (row.SubjectId < after.SubjectId
                        || (row.SubjectId == after.SubjectId && row.ActorId < after.ActorId))))));
        }

        var fetched = await rows
            .OrderByDescending(row => row.At)
            .ThenBy(row => row.Kind)
            .ThenByDescending(row => row.SubjectId)
            .ThenByDescending(row => row.ActorId)
            .Take(query.Limit + 1)
            .ToListAsync(ct);

        var page = fetched.Take(query.Limit).ToList();
        var nextCursor = fetched.Count > query.Limit ? ActivityCursor.After(page[^1]).Encode() : null;
        return new OpaqueCursorPage<ActivityItem>(await DescribeAsync(userId, page, ct), nextCursor);
    }

    public async Task<int> CountUnreadAsync(long userId, CancellationToken ct)
    {
        var rows = Rows(userId);
        if (await ReadAtAsync(userId, ct) is { } readAt)
        {
            rows = rows.Where(row => row.At > readAt);
        }

        return await rows.CountAsync(ct);
    }

    /// <summary>Marks everything up to <paramref name="upTo"/> as read.</summary>
    public async Task MarkReadAsync(long userId, DateTimeOffset upTo, CancellationToken ct)
    {
        // Never past now, so a client with a fast clock can't hide activity
        // that hasn't happened yet, and never backwards, so a stale tab can't
        // make seen items unread again.
        var now = time.GetUtcNow();
        DateTime? readAt = (upTo < now ? upTo : now).UtcDateTime;
        await db.Users
            .Where(user => user.Id == userId && (user.ActivityReadAt == null || user.ActivityReadAt < readAt))
            .ExecuteUpdateAsync(set => set.SetProperty(user => user.ActivityReadAt, readAt), ct);
    }

    /// <summary>
    /// Every activity row for the member, as one query: likes on their posts,
    /// likes on their comments, and comments on their posts or replies to
    /// their comments. Their own actions are left out.
    /// </summary>
    private IQueryable<ActivityRow> Rows(long userId)
    {
        var postLikes = db.PostLikes
            .Where(like => like.Post.AuthorId == userId && like.UserId != userId)
            .Select(like => new ActivityRow
            {
                Kind = (int)ActivityKind.PostLike,
                At = like.CreatedAt,
                SubjectId = like.PostId,
                ActorId = like.UserId,
                PostId = like.PostId,
                CommentId = null,
            });

        var commentLikes = db.CommentLikes
            .Where(like => like.Comment.AuthorId == userId && like.UserId != userId)
            .Select(like => new ActivityRow
            {
                Kind = (int)ActivityKind.CommentLike,
                At = like.CreatedAt,
                SubjectId = like.CommentId,
                ActorId = like.UserId,
                PostId = like.Comment.PostId,
                CommentId = like.CommentId,
            });

        // A reply to the member's comment is a reply even on their own post.
        var comments = db.Comments
            .Where(comment => comment.AuthorId != userId
                && (comment.Post.AuthorId == userId
                    || (comment.ParentComment != null && comment.ParentComment.AuthorId == userId)))
            .Select(comment => new ActivityRow
            {
                Kind = comment.ParentComment != null && comment.ParentComment.AuthorId == userId
                    ? (int)ActivityKind.Reply
                    : (int)ActivityKind.Comment,
                At = comment.CreatedAt,
                SubjectId = comment.Id,
                ActorId = comment.AuthorId,
                PostId = comment.PostId,
                CommentId = comment.Id,
            });

        return postLikes.Concat(commentLikes).Concat(comments);
    }

    /// <summary>
    /// Adds who did it and what it was about. Something deleted since the
    /// page was read is left out rather than shown half-empty.
    /// </summary>
    private async Task<List<ActivityItem>> DescribeAsync(long userId, List<ActivityRow> rows, CancellationToken ct)
    {
        if (rows.Count == 0)
        {
            return [];
        }

        var readAt = await ReadAtAsync(userId, ct);
        var actorIds = rows.Select(row => row.ActorId).Distinct().ToList();
        var postIds = rows.Where(row => row.CommentId is null).Select(row => row.PostId).Distinct().ToList();
        var commentIds = rows.Where(row => row.CommentId is not null).Select(row => row.CommentId!.Value).Distinct().ToList();

        var actors = await db.Users
            .Where(user => actorIds.Contains(user.Id))
            .Select(user => new UserSummary(user.Id, user.Username, user.DisplayName, FileUrls.Of(user.AvatarKey)))
            .ToDictionaryAsync(user => user.Id, ct);

        // Substring runs as SQL SUBSTRING, so long posts aren't read in full,
        // and unlike string.Substring it copes with shorter text.
        var postExcerpts = await db.Posts
            .Where(post => postIds.Contains(post.Id))
            .Select(post => new { post.Id, Excerpt = post.Body.Substring(0, ExcerptLength) })
            .ToDictionaryAsync(post => post.Id, post => post.Excerpt, ct);
        var commentExcerpts = await db.Comments
            .Where(comment => commentIds.Contains(comment.Id))
            .Select(comment => new { comment.Id, Excerpt = comment.Body.Substring(0, ExcerptLength) })
            .ToDictionaryAsync(comment => comment.Id, comment => comment.Excerpt, ct);

        var items = new List<ActivityItem>(rows.Count);
        foreach (var row in rows)
        {
            var excerpt = row.CommentId is { } commentId
                ? commentExcerpts.GetValueOrDefault(commentId)
                : postExcerpts.GetValueOrDefault(row.PostId);
            if (actors.GetValueOrDefault(row.ActorId) is { } actor && excerpt is not null)
            {
                items.Add(new ActivityItem(
                    (ActivityKind)row.Kind, row.At, actor, row.PostId, row.CommentId, excerpt, readAt is null || row.At > readAt));
            }
        }

        return items;
    }

    private Task<DateTime?> ReadAtAsync(long userId, CancellationToken ct) =>
        db.Users.Where(user => user.Id == userId).Select(user => user.ActivityReadAt).SingleOrDefaultAsync(ct);
}

/// <summary>
/// A row of the union query: keys and times only, so the sources line up.
/// Kind, time, actor and <see cref="SubjectId"/> identify it for the cursor.
/// </summary>
internal sealed class ActivityRow
{
    public int Kind { get; init; }
    public DateTime At { get; init; }
    public long SubjectId { get; init; }
    public long ActorId { get; init; }
    public long PostId { get; init; }
    public long? CommentId { get; init; }
}
