using Microsoft.EntityFrameworkCore;
using Sparks.Api.Activity.Services;
using Sparks.Api.Common.Data;
using Sparks.Api.Common.Errors;
using Sparks.Api.Common.Models;
using Sparks.Api.Storage.Services;
using Sparks.Api.Users.Data;
using Sparks.Api.Users.Models;

namespace Sparks.Api.Users.Services;

/// <summary>Members following members: following and unfollowing, the lists on a profile, and who to follow.</summary>
public sealed class FollowService(SparksDbContext db, TimeProvider time, ActivityNotifier activity)
{
    /// <summary>Follows a member. Following twice is harmless: the result is the same.</summary>
    public async Task<FollowState> FollowAsync(long followerId, string username, CancellationToken ct)
    {
        var followeeId = await db.Users.IdOfAsync(username, ct);
        if (followeeId == followerId)
        {
            throw UserErrors.CannotFollowYourself();
        }

        if (!await db.Follows.AnyAsync(follow => follow.FollowerId == followerId && follow.FolloweeId == followeeId, ct))
        {
            db.Follows.Add(new FollowEntity
            {
                FollowerId = followerId,
                FolloweeId = followeeId,
                CreatedAt = time.GetUtcNow().UtcDateTime,
            });
            try
            {
                await db.SaveChangesAsync(ct);
                await activity.FollowedAsync(followerId, followeeId, ct);
            }
            catch (DbUpdateException ex) when (ex.IsUniqueViolation())
            {
                // A concurrent request followed first; the outcome is the same.
            }
        }

        return await StateAsync(followerId, followeeId, ct);
    }

    /// <summary>Stops following a member. Unfollowing someone not followed is harmless.</summary>
    public async Task<FollowState> UnfollowAsync(long followerId, string username, CancellationToken ct)
    {
        var followeeId = await db.Users.IdOfAsync(username, ct);
        await db.Follows
            .Where(follow => follow.FollowerId == followerId && follow.FolloweeId == followeeId)
            .ExecuteDeleteAsync(ct);
        return await StateAsync(followerId, followeeId, ct);
    }

    /// <summary>Who follows the member, latest follower first.</summary>
    public async Task<OpaqueCursorPage<MemberResponse>> GetFollowersAsync(
        string username, OpaquePageRequest page, long? viewerId, CancellationToken ct)
    {
        var userId = await db.Users.IdOfAsync(username, ct);
        var followers = db.Follows.AsNoTracking()
            .Where(follow => follow.FolloweeId == userId)
            .Select(follow => new FollowRow { At = follow.CreatedAt, Member = follow.Follower });
        return await PageAsync(followers, page, viewerId, ct);
    }

    /// <summary>Who the member follows, latest followed first.</summary>
    public async Task<OpaqueCursorPage<MemberResponse>> GetFollowingAsync(
        string username, OpaquePageRequest page, long? viewerId, CancellationToken ct)
    {
        var userId = await db.Users.IdOfAsync(username, ct);
        var followed = db.Follows.AsNoTracking()
            .Where(follow => follow.FollowerId == userId)
            .Select(follow => new FollowRow { At = follow.CreatedAt, Member = follow.Followee });
        return await PageAsync(followed, page, viewerId, ct);
    }

    /// <summary>
    /// Members with sparks the viewer doesn't follow yet: the most followed
    /// first, then those whose sparks are liked most. A start for an empty
    /// Following feed.
    /// </summary>
    public async Task<IReadOnlyList<MemberResponse>> SuggestAsync(long viewerId, int limit, CancellationToken ct) =>
        await db.Users.AsNoTracking()
            .Where(user => user.Id != viewerId
                && db.Posts.Any(post => post.AuthorId == user.Id)
                && !db.Follows.Any(follow => follow.FollowerId == viewerId && follow.FolloweeId == user.Id))
            .OrderByDescending(user => db.Follows.Count(follow => follow.FolloweeId == user.Id))
            .ThenByDescending(user => db.PostLikes.Count(like => like.Post.AuthorId == user.Id))
            .ThenByDescending(user => user.Id)
            .Take(limit)
            .Select(user => new MemberResponse(
                user.Id, user.Username, user.DisplayName, FileUrls.Of(user.AvatarKey), user.Bio, false))
            .ToListAsync(ct);

    /// <summary>
    /// A page of a follow list. Follows have no id of their own, so the
    /// cursor holds the time and the member's id.
    /// </summary>
    private async Task<OpaqueCursorPage<MemberResponse>> PageAsync(
        IQueryable<FollowRow> rows, OpaquePageRequest page, long? viewerId, CancellationToken ct)
    {
        if (page.Cursor is not null)
        {
            if (OpaqueCursor.Decode(page.Cursor, partCount: 2) is not [var ticks, var id] || ticks > DateTime.MaxValue.Ticks)
            {
                throw ApiException.BadRequest("INVALID_CURSOR", "That cursor didn't come from this API.");
            }

            var at = new DateTime(ticks, DateTimeKind.Utc);
            rows = rows.Where(row => row.At < at || (row.At == at && row.Member.Id < id));
        }

        var fetched = await rows
            .OrderByDescending(row => row.At)
            .ThenByDescending(row => row.Member.Id)
            .Take(page.Limit + 1)
            .Select(row => new
            {
                row.At,
                Member = new MemberResponse(
                    row.Member.Id,
                    row.Member.Username,
                    row.Member.DisplayName,
                    FileUrls.Of(row.Member.AvatarKey),
                    row.Member.Bio,
                    viewerId != null && db.Follows.Any(follow => follow.FollowerId == viewerId && follow.FolloweeId == row.Member.Id)),
            })
            .ToListAsync(ct);

        var items = fetched.Take(page.Limit).ToList();
        var nextCursor = fetched.Count > page.Limit ? OpaqueCursor.Encode(items[^1].At.Ticks, items[^1].Member.Id) : null;
        return new OpaqueCursorPage<MemberResponse>(items.Select(item => item.Member).ToList(), nextCursor);
    }

    private Task<FollowState> StateAsync(long followerId, long followeeId, CancellationToken ct) =>
        db.Users
            .Where(user => user.Id == followeeId)
            .Select(user => new FollowState(
                db.Follows.Any(follow => follow.FollowerId == followerId && follow.FolloweeId == user.Id),
                db.Follows.Count(follow => follow.FolloweeId == user.Id)))
            .SingleAsync(ct);
}

/// <summary>A row of a follow list: when the follow happened, and the member it lists.</summary>
internal sealed class FollowRow
{
    public DateTime At { get; init; }
    public UserEntity Member { get; init; } = null!;
}
