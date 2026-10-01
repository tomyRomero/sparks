using System.ComponentModel.DataAnnotations;
using Sparks.Api.Common.Constants;
using Sparks.Api.Common.Models;
using Sparks.Api.Posts.Data;
using Sparks.Api.Users.Models;

namespace Sparks.Api.Posts.Models;

/// <summary>A spark as the feed and the post page show it.</summary>
/// <param name="ImageUrl">The attached image's path under the API; null when there's none.</param>
/// <param name="TopComment">The most-liked comment (the earliest, among equals), for a preview in lists.</param>
public sealed record PostResponse(
    long Id,
    SparkKind Kind,
    string Body,
    string? ImageUrl,
    string? AiPrompt,
    DateTime CreatedAt,
    DateTime? EditedAt,
    UserSummary Author,
    int LikeCount,
    int CommentCount,
    bool LikedByMe,
    CommentPreview? TopComment);

/// <summary>A comment shown under a spark in a list: who said it, and the start of what they said.</summary>
/// <param name="Body">Up to <see cref="ExcerptLength"/> characters of it.</param>
public sealed record CommentPreview(long Id, string Body, UserSummary Author)
{
    public const int ExcerptLength = 280;
}

public sealed record CreatePostRequest
{
    [Required]
    public SparkKind? Kind { get; init; }

    [Required, StringLength(InputLimits.PostBodyMaxLength)]
    public string Body { get; init; } = string.Empty;

    /// <summary>The prompt, when the body was drafted with AI.</summary>
    [StringLength(InputLimits.AiPromptMaxLength)]
    public string? AiPrompt { get; init; }

    /// <summary>The key of an image the author uploaded or generated for this post.</summary>
    [StringLength(InputLimits.StorageKeyMaxLength)]
    public string? ImageKey { get; init; }
}

public sealed record UpdatePostRequest
{
    [Required, StringLength(InputLimits.PostBodyMaxLength)]
    public string Body { get; init; } = string.Empty;
}

/// <summary>Filters for the post feed, on top of paging.</summary>
public sealed record PostFeedQuery : PageRequest
{
    /// <summary>Any of these kinds (repeat <c>kind</c> for several); every kind when there's none.</summary>
    [MaxLength(PostFilters.MaxKinds)]
    public SparkKind[] Kind { get; init; } = [];

    /// <summary>Only posts with a picture.</summary>
    public bool Pictures { get; init; }

    /// <summary>Matches the post text or the author's name.</summary>
    [StringLength(PostFilters.MaxQueryLength)]
    public string? Q { get; init; }
}

/// <summary>The most liked posts of the last few days, with the feed's filters.</summary>
public sealed record TopPostsQuery : OpaquePageRequest
{
    [MaxLength(PostFilters.MaxKinds)]
    public SparkKind[] Kind { get; init; } = [];

    public bool Pictures { get; init; }

    [Range(1, 30)]
    public int Days { get; init; } = 7;
}

public static class PostFilters
{
    public const int MaxKinds = 10;
    public const int MaxQueryLength = 100;
}

/// <summary>The viewer's like on an item, after a like or unlike.</summary>
public sealed record LikeState(bool Liked, int LikeCount);
