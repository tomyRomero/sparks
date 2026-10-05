using System.ComponentModel.DataAnnotations;

namespace Sparks.Api.Users.Models;

/// <summary>The viewer's follow of a member, after a follow or unfollow.</summary>
public sealed record FollowState(bool Following, int FollowerCount);

/// <summary>A member in a list of people: followers, following, and who to follow.</summary>
/// <param name="AvatarUrl">The profile picture's path under the API; null when there's none.</param>
/// <param name="FollowedByMe">Whether the viewer follows them; always false for guests.</param>
public sealed record MemberResponse(
    long Id,
    string Username,
    string DisplayName,
    string? AvatarUrl,
    string? Bio,
    bool FollowedByMe);

public sealed record SuggestionsQuery
{
    [Range(1, 20)]
    public int Limit { get; init; } = 5;
}
