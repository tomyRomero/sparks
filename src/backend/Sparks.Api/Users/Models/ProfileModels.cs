using System.ComponentModel.DataAnnotations;
using Sparks.Api.Common.Constants;
using Sparks.Api.Common.Models;

namespace Sparks.Api.Users.Models;

/// <summary>The header of a member's profile page. Public, so it never includes the email.</summary>
/// <param name="AvatarUrl">The profile picture's path under the API; null when there's none.</param>
/// <param name="LikesReceived">Likes on the member's posts, from everyone.</param>
/// <param name="CommentCount">Comments and replies the member wrote.</param>
/// <param name="PictureCount">The member's posts that have a picture.</param>
/// <param name="CoverUrl">The picture of the member's most liked post that has one, for the top of the page; null when there's none.</param>
/// <param name="FollowedByMe">Whether the viewer follows them; always false for guests and on your own profile.</param>
/// <param name="FollowsMe">Whether they follow the viewer.</param>
public sealed record ProfileResponse(
    long Id,
    string Username,
    string DisplayName,
    string? Bio,
    string? AvatarUrl,
    DateTime JoinedAt,
    int PostCount,
    int LikesReceived,
    int CommentCount,
    int PictureCount,
    string? CoverUrl,
    int FollowerCount,
    int FollowingCount,
    bool FollowedByMe,
    bool FollowsMe);

/// <summary>A member's posts, on top of paging.</summary>
public sealed record UserPostsQuery : PageRequest
{
    /// <summary>Only posts with a picture, for the Pictures grid.</summary>
    public bool Pictures { get; init; }
}

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
