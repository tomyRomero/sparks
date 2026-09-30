using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Sparks.Api.Common.Data;
using Sparks.Api.Common.Models;
using Sparks.Api.Users.Data;
using Sparks.Api.Users.Models;

namespace Sparks.Api.Users.Services;

/// <summary>Members: profiles, editing your own, and finding others.</summary>
public sealed class UserService(SparksDbContext db)
{
    /// <summary>A profile by username, matched without regard to case.</summary>
    public async Task<ProfileResponse> GetProfileAsync(string username, CancellationToken ct) =>
        await db.Users.AsNoTracking()
            .Where(user => user.Username == username)
            .Select(ToProfile())
            .SingleOrDefaultAsync(ct)
        ?? throw UserErrors.UserNotFound();

    /// <summary>The id behind a username, for the lists on a profile page.</summary>
    public async Task<long> GetIdAsync(string username, CancellationToken ct) =>
        await db.Users
            .Where(user => user.Username == username)
            .Select(user => (long?)user.Id)
            .SingleOrDefaultAsync(ct)
        ?? throw UserErrors.UserNotFound();

    public async Task<ProfileResponse> UpdateProfileAsync(long userId, UpdateProfileRequest request, CancellationToken ct)
    {
        var displayName = request.DisplayName.Trim();
        var bio = string.IsNullOrWhiteSpace(request.Bio) ? null : request.Bio.Trim();
        await db.Users
            .Where(user => user.Id == userId)
            .ExecuteUpdateAsync(set => set
                .SetProperty(user => user.DisplayName, displayName)
                .SetProperty(user => user.Bio, bio), ct);

        return await db.Users.AsNoTracking()
            .Where(user => user.Id == userId)
            .Select(ToProfile())
            .SingleOrDefaultAsync(ct)
            ?? throw UserErrors.UserNotFound();
    }

    /// <summary>
    /// Members whose username or display name contains the search, newest
    /// first. The viewer is left out: this is for finding other people.
    /// </summary>
    public async Task<CursorPage<UserSummary>> SearchAsync(UserSearchQuery query, long? viewerId, CancellationToken ct)
    {
        var users = db.Users.AsNoTracking();
        if (viewerId is { } self)
        {
            users = users.Where(user => user.Id != self);
        }

        if (!string.IsNullOrWhiteSpace(query.Q))
        {
            var text = query.Q.Trim();
            users = users.Where(user => user.Username.Contains(text) || user.DisplayName.Contains(text));
        }

        var fetched = await users
            .NewestFirst(query)
            .Select(user => new UserSummary(user.Id, user.Username, user.DisplayName))
            .ToListAsync(ct);
        return CursorPage.From(fetched, query.Limit, user => user.Id);
    }

    /// <summary>The profile projection, with its counts computed in SQL.</summary>
    private Expression<Func<UserEntity, ProfileResponse>> ToProfile() => user => new ProfileResponse(
        user.Id,
        user.Username,
        user.DisplayName,
        user.Bio,
        user.CreatedAt,
        db.Posts.Count(post => post.AuthorId == user.Id),
        db.PostLikes.Count(like => like.Post.AuthorId == user.Id));
}
