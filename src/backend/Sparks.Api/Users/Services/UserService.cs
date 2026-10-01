using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Sparks.Api.Common.Data;
using Sparks.Api.Common.Models;
using Sparks.Api.Storage;
using Sparks.Api.Users.Data;
using Sparks.Api.Users.Models;

namespace Sparks.Api.Users.Services;

/// <summary>Members: profiles, editing your own, and finding others.</summary>
public sealed class UserService(
    SparksDbContext db, ImageUploadService images, IFileStorage storage, ILogger<UserService> logger)
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

        return await GetOwnProfileAsync(userId, ct);
    }

    /// <summary>Replaces the member's profile picture with an uploaded image.</summary>
    public async Task<ProfileResponse> SetAvatarAsync(long userId, IFormFile file, CancellationToken ct)
    {
        var key = await images.SaveAsync(file, StorageKeys.Avatars, userId, ImageUploadService.MaxAvatarBytes, ct);
        return await ReplaceAvatarAsync(userId, key, ct);
    }

    public Task<ProfileResponse> RemoveAvatarAsync(long userId, CancellationToken ct) =>
        ReplaceAvatarAsync(userId, key: null, ct);

    /// <summary>Points the profile at a new picture (or none), then removes the old file.</summary>
    private async Task<ProfileResponse> ReplaceAvatarAsync(long userId, string? key, CancellationToken ct)
    {
        var me = db.Users.Where(user => user.Id == userId);
        var previous = await me.Select(user => user.AvatarKey).SingleOrDefaultAsync(ct);
        await me.ExecuteUpdateAsync(set => set.SetProperty(user => user.AvatarKey, key), ct);
        if (previous is not null)
        {
            await storage.TryDeleteAsync(previous, logger);
        }

        return await GetOwnProfileAsync(userId, ct);
    }

    private async Task<ProfileResponse> GetOwnProfileAsync(long userId, CancellationToken ct) =>
        await db.Users.AsNoTracking()
            .Where(user => user.Id == userId)
            .Select(ToProfile())
            .SingleOrDefaultAsync(ct)
        ?? throw UserErrors.UserNotFound();

    /// <summary>
    /// Members whose username or display name contains the search, newest
    /// first. The viewer is left out: this is for finding other people.
    /// </summary>
    public async Task<CursorPage<UserSummary>> SearchAsync(UserSearchQuery query, long? viewerId, CancellationToken ct)
    {
        var fetched = await Matching(query.Q, viewerId)
            .NewestFirst(query)
            .Select(user => new UserSummary(user.Id, user.Username, user.DisplayName, FileUrls.Of(user.AvatarKey)))
            .ToListAsync(ct);
        return CursorPage.From(fetched, query.Limit, user => user.Id);
    }

    public Task<int> CountMatchingAsync(string q, long? viewerId, CancellationToken ct) =>
        Matching(q, viewerId).CountAsync(ct);

    private IQueryable<UserEntity> Matching(string? q, long? viewerId)
    {
        var users = db.Users.AsNoTracking();
        if (viewerId is { } self)
        {
            users = users.Where(user => user.Id != self);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var text = q.Trim();
            users = users.Where(user => user.Username.Contains(text) || user.DisplayName.Contains(text));
        }

        return users;
    }

    /// <summary>The profile projection, with its counts computed in SQL.</summary>
    private Expression<Func<UserEntity, ProfileResponse>> ToProfile() => user => new ProfileResponse(
        user.Id,
        user.Username,
        user.DisplayName,
        user.Bio,
        FileUrls.Of(user.AvatarKey),
        user.CreatedAt,
        db.Posts.Count(post => post.AuthorId == user.Id),
        db.PostLikes.Count(like => like.Post.AuthorId == user.Id));
}
