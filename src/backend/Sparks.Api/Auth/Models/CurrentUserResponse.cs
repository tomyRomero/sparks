using Sparks.Api.Storage.Services;
using Sparks.Api.Users.Data;

namespace Sparks.Api.Auth.Models;

/// <summary>The signed-in user, as returned by sign-up, sign-in and <c>GET /auth/me</c>.</summary>
/// <param name="AvatarUrl">The profile picture's path under the API; null when there's none.</param>
public sealed record CurrentUserResponse(long Id, string Username, string DisplayName, string Email, string? AvatarUrl)
{
    public static CurrentUserResponse From(UserEntity user) =>
        new(user.Id, user.Username, user.DisplayName, user.Email, FileUrls.Of(user.AvatarKey));
}
