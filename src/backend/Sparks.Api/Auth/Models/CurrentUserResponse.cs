using Sparks.Api.Users.Data;

namespace Sparks.Api.Auth.Models;

/// <summary>The signed-in user, as returned by sign-up, sign-in and <c>GET /auth/me</c>.</summary>
public sealed record CurrentUserResponse(long Id, string Username, string DisplayName, string Email)
{
    public static CurrentUserResponse From(UserEntity user) =>
        new(user.Id, user.Username, user.DisplayName, user.Email);
}
