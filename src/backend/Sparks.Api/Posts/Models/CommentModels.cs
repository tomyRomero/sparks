using System.ComponentModel.DataAnnotations;
using Sparks.Api.Common.Constants;
using Sparks.Api.Users.Models;

namespace Sparks.Api.Posts.Models;

/// <summary>A comment or reply as a thread shows it.</summary>
/// <param name="ParentCommentId">The comment this one replies to; null for a comment directly on the post.</param>
/// <param name="ReplyCount">Direct replies only; each reply shows its own count.</param>
public sealed record CommentResponse(
    long Id,
    long PostId,
    long? ParentCommentId,
    string Body,
    DateTime CreatedAt,
    DateTime? EditedAt,
    UserSummary Author,
    int LikeCount,
    int ReplyCount,
    bool LikedByMe);

/// <summary>The text of a new comment or reply, or a comment's new text.</summary>
public sealed record CommentRequest
{
    [Required, StringLength(InputLimits.CommentBodyMaxLength)]
    public string Body { get; init; } = string.Empty;
}
