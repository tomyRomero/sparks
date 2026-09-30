using System.ComponentModel.DataAnnotations;
using Sparks.Api.Common.Constants;
using Sparks.Api.Common.Models;

namespace Sparks.Api.Users.Models;

/// <summary>The header of a member's profile page. Public, so it never includes the email.</summary>
/// <param name="LikesReceived">Likes on the member's posts, from everyone.</param>
public sealed record ProfileResponse(
    long Id,
    string Username,
    string DisplayName,
    string? Bio,
    DateTime JoinedAt,
    int PostCount,
    int LikesReceived);

/// <summary>A member's changes to their own profile. A blank bio clears it.</summary>
public sealed record UpdateProfileRequest
{
    [Required, StringLength(InputLimits.DisplayNameMaxLength)]
    public string DisplayName { get; init; } = string.Empty;

    [StringLength(InputLimits.BioMaxLength)]
    public string? Bio { get; init; }
}

/// <summary>Finding members, newest first.</summary>
public sealed record UserSearchQuery : PageRequest
{
    /// <summary>Matches the username or the display name.</summary>
    [StringLength(100)]
    public string? Q { get; init; }
}
