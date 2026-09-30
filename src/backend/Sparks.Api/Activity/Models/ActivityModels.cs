using System.ComponentModel.DataAnnotations;
using Sparks.Api.Users.Models;

namespace Sparks.Api.Activity.Models;

/// <summary>What someone did to a member's content.</summary>
public enum ActivityKind
{
    /// <summary>Liked one of the member's posts.</summary>
    PostLike,

    /// <summary>Liked one of the member's comments.</summary>
    CommentLike,

    /// <summary>Commented on one of the member's posts.</summary>
    Comment,

    /// <summary>Replied to one of the member's comments.</summary>
    Reply,
}

/// <summary>One thing someone else did to the member's posts or comments.</summary>
/// <param name="CommentId">The comment liked, or the new comment or reply; null for a post like.</param>
/// <param name="Excerpt">The start of the post or comment liked, or of the new comment.</param>
/// <param name="Unread">Newer than the point the member last marked as read.</param>
public sealed record ActivityItem(
    ActivityKind Kind,
    DateTime At,
    UserSummary Actor,
    long PostId,
    long? CommentId,
    string Excerpt,
    bool Unread);

public sealed record MarkActivityReadRequest
{
    /// <summary>
    /// The time of the newest item the member has seen. Anything later stays
    /// unread, so activity that arrives while the page is open isn't lost.
    /// </summary>
    [Required]
    public DateTimeOffset? UpTo { get; init; }
}

public sealed record UnreadActivity(int Count);
