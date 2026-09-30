using System.ComponentModel.DataAnnotations;
using Sparks.Api.Common.Constants;
using Sparks.Api.Common.Models;
using Sparks.Api.Posts.Data;
using Sparks.Api.Users.Models;

namespace Sparks.Api.Posts.Models;

/// <summary>A spark as the feed and the post page show it.</summary>
public sealed record PostResponse(
    long Id,
    SparkKind Kind,
    string Body,
    string? AiPrompt,
    DateTime CreatedAt,
    DateTime? EditedAt,
    UserSummary Author,
    int LikeCount,
    int CommentCount,
    bool LikedByMe);

public sealed record CreatePostRequest
{
    [Required]
    public SparkKind? Kind { get; init; }

    [Required, StringLength(InputLimits.PostBodyMaxLength)]
    public string Body { get; init; } = string.Empty;

    /// <summary>The prompt, when the body was drafted with AI.</summary>
    [StringLength(InputLimits.AiPromptMaxLength)]
    public string? AiPrompt { get; init; }
}

public sealed record UpdatePostRequest
{
    [Required, StringLength(InputLimits.PostBodyMaxLength)]
    public string Body { get; init; } = string.Empty;
}

/// <summary>Filters for the post feed, on top of paging.</summary>
public sealed record PostFeedQuery : PageRequest
{
    public SparkKind? Kind { get; init; }

    /// <summary>Matches the post text or the author's name.</summary>
    [StringLength(100)]
    public string? Q { get; init; }
}

/// <summary>The viewer's like on an item, after a like or unlike.</summary>
public sealed record LikeState(bool Liked, int LikeCount);
