namespace Sparks.Api.Users.Models;

/// <summary>How a user appears next to their content: enough for a name, a picture and a link.</summary>
/// <param name="AvatarUrl">The profile picture's path under the API; null when there's none.</param>
public sealed record UserSummary(long Id, string Username, string DisplayName, string? AvatarUrl);
