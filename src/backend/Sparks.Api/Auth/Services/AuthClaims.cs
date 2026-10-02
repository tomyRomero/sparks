using System.Globalization;
using System.Security.Claims;

namespace Sparks.Api.Auth.Services;

/// <summary>Claim names in Sparks access tokens (standard JWT names).</summary>
public static class AuthClaims
{
    public const string UserId = "sub";
    public const string SessionId = "sid";
    public const string Username = "username";

    /// <summary>
    /// The signed-in user's id. Only call this on an authenticated request;
    /// every token the API issues carries the claim.
    /// </summary>
    public static long GetUserId(this ClaimsPrincipal principal) =>
        principal.FindUserId() ?? throw new InvalidOperationException("The request is not authenticated.");

    /// <summary>The signed-in user's id, or null for an anonymous request.</summary>
    public static long? FindUserId(this ClaimsPrincipal principal) =>
        principal.FindFirstValue(UserId) is { } value
            ? long.Parse(value, CultureInfo.InvariantCulture)
            : null;
}
