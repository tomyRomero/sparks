using Microsoft.AspNetCore.SignalR;
using Sparks.Api.Auth.Services;

namespace Sparks.Api.Realtime;

/// <summary>
/// Addresses connections by the user id in the access token's <c>sub</c>
/// claim. SignalR's default looks for a claim type that Sparks' tokens,
/// which keep their short JWT claim names, don't have.
/// </summary>
internal sealed class UserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection) =>
        connection.User.FindFirst(AuthClaims.UserId)?.Value;
}
