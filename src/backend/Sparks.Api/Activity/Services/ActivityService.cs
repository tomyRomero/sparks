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

    /// <summary>The most recent likers shown on a grouped item.</summary>
    private const int ActorsShown = 3;

    /// <summary>
    /// Newest first. Likes on the same post or comment fold into one item
    /// with the latest likers and a count; each comment and reply is its own.
    /// </summary>
    public async Task<OpaqueCursorPage<ActivityItem>> GetAsync(long userId, ActivityQuery query, CancellationToken ct)
    {
        var groups = Rows(userId, query.Filter)
            .GroupBy(row => new { row.Kind, row.SubjectId, row.PostId, row.CommentId })
            .Select(group => new ActivityGroup
            {
                Kind = group.Key.Kind,
                SubjectId = group.Key.SubjectId,
                PostId = group.Key.PostId,
                CommentId = group.Key.CommentId,
                At = group.Max(row => row.At),
                Count = group.Count(),
            });

        if (query.Cursor is not null)
        {
            var after = ActivityCursor.Parse(query.Cursor)
                ?? throw ApiException.BadRequest("INVALID_CURSOR", "That cursor didn't come from this API.");

            // The groups after the cursor in the sort order below.
            groups = groups.Where(group =>
                group.At < after.At
                || (group.At == after.At && (group.Kind > after.Kind
                    || (group.Kind == after.Kind && group.SubjectId < after.SubjectId))));
        }

        var fetched = await groups
            .OrderByDescending(group => group.At)
            .ThenBy(group => group.Kind)
            .ThenByDescending(group => group.SubjectId)
            .Take(query.Limit + 1)
            .ToListAsync(ct);

        var page = fetched.Take(query.Limit).ToList();
        var nextCursor = fetched.Count > query.Limit ? ActivityCursor.After(page[^1]).Encode() : null;
        return new OpaqueCursorPage<ActivityItem>(await DescribeAsync(userId, page, ct), nextCursor);
    }

    public async Task<int> CountUnreadAsync(long userId, CancellationToken ct)
    {
        var rows = Rows(userId, filter: null);
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
    private IQueryable<ActivityRow> Rows(long userId, ActivityFilter? filter)
    {
        var rows = AllRows(userId);
        return filter switch
        {
            ActivityFilter.Likes => rows.Where(row =>
                row.Kind == (int)ActivityKind.PostLike || row.Kind == (int)ActivityKind.CommentLike),
            ActivityFilter.Comments => rows.Where(row => row.Kind == (int)ActivityKind.Comment),
            ActivityFilter.Replies => rows.Where(row => row.Kind == (int)ActivityKind.Reply),
            _ => rows,
        };
    }

    private IQueryable<ActivityRow> AllRows(long userId)
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
    private async Task<List<ActivityItem>> DescribeAsync(long userId, List<ActivityGroup> groups, CancellationToken ct)
    {
        if (groups.Count == 0)
        {
            return [];
        }

        var readAt = await ReadAtAsync(userId, ct);

        // Who did it, latest first: every row behind the page's groups.
        var subjectIds = groups.Select(group => group.SubjectId).Distinct().ToList();
        var rows = await AllRows(userId)
            .Where(row => subjectIds.Contains(row.SubjectId))
            .Select(row => new { row.Kind, row.SubjectId, row.ActorId, row.At })
            .ToListAsync(ct);
        var actorIdsByGroup = rows
            .GroupBy(row => (row.Kind, row.SubjectId))
            .ToDictionary(
                group => group.Key,
                group => group.OrderByDescending(row => row.At).Select(row => row.ActorId).Take(ActorsShown).ToList());

        var actorIds = actorIdsByGroup.Values.SelectMany(ids => ids).Distinct().ToList();
        var postIds = groups.Where(group => group.CommentId is null).Select(group => group.PostId).Distinct().ToList();
        var commentIds = groups.Where(group => group.CommentId is not null).Select(group => group.CommentId!.Value).Distinct().ToList();

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

        var items = new List<ActivityItem>(groups.Count);
        foreach (var group in groups)
        {
            var excerpt = group.CommentId is { } commentId
                ? commentExcerpts.GetValueOrDefault(commentId)
                : postExcerpts.GetValueOrDefault(group.PostId);
            var who = actorIdsByGroup.GetValueOrDefault((group.Kind, group.SubjectId)) ?? [];
            var known = who.Select(id => actors.GetValueOrDefault(id)).OfType<UserSummary>().ToList();
            if (known.Count > 0 && excerpt is not null)
            {
                items.Add(new ActivityItem(
                    (ActivityKind)group.Kind,
                    group.At,
                    known,
                    group.Count,
                    group.PostId,
                    group.CommentId,
                    excerpt,
                    readAt is null || group.At > readAt));
            }
        }

        return items;
    }

    private Task<DateTime?> ReadAtAsync(long userId, CancellationToken ct) =>
        db.Users.Where(user => user.Id == userId).Select(user => user.ActivityReadAt).SingleOrDefaultAsync(ct);
}

/// <summary>A row of the union query: keys and times only, so the sources line up.</summary>
internal sealed class ActivityRow
{
    public int Kind { get; init; }
    public DateTime At { get; init; }
    public long SubjectId { get; init; }
    public long ActorId { get; init; }
    public long PostId { get; init; }
    public long? CommentId { get; init; }
}

/// <summary>Activity rows folded by what they're about. Kind, time and subject identify it for the cursor.</summary>
internal sealed class ActivityGroup
{
    public int Kind { get; init; }
    public long SubjectId { get; init; }
    public long PostId { get; init; }
    public long? CommentId { get; init; }
    public DateTime At { get; init; }
    public int Count { get; init; }
}
