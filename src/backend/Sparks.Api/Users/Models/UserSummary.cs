namespace Sparks.Api.Users.Models;

/// <summary>How a user appears next to their content: enough for a name and a link.</summary>
public sealed record UserSummary(long Id, string Username, string DisplayName);
