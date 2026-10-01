using System.ComponentModel.DataAnnotations;
using Sparks.Api.Common.Models;
using Sparks.Api.Users.Models;

namespace Sparks.Api.Activity.Models;

/// <summary>What someone did to a member's content, or to the member.</summary>
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

    /// <summary>Started following the member.</summary>
    Follow,
}

/// <summary>
/// Something others did to the member's posts or comments, or to the member.
/// Likes on one thing come as one item, and so do a day's new followers.
/// </summary>
/// <param name="At">When the latest of it happened.</param>
/// <param name="Actors">Who did it, latest first, up to three.</param>
/// <param name="Count">How many did it: one for a comment or reply, every liker for a like, every new follower that day for a follow.</param>
/// <param name="PostId">The post it's about; null for a follow.</param>
/// <param name="CommentId">The comment liked, or the new comment or reply; null for a post like or a follow.</param>
/// <param name="Excerpt">The start of the post or comment liked, or of the new comment; null for a follow.</param>
/// <param name="Unread">Newer than the point the member last marked as read.</param>
public sealed record ActivityItem(
    ActivityKind Kind,
    DateTime At,
    IReadOnlyList<UserSummary> Actors,
    int Count,
    long? PostId,
    long? CommentId,
    string? Excerpt,
    bool Unread);

/// <summary>New activity, pushed live to the member it's about. Post, comment and excerpt are as on <see cref="ActivityItem"/>.</summary>
public sealed record ActivityNotice(ActivityKind Kind, UserSummary Actor, long? PostId, long? CommentId, string? Excerpt);

public enum ActivityFilter
{
    Likes,
    Comments,
    Replies,
    Follows,
}

public sealed record ActivityQuery : OpaquePageRequest
{
    /// <summary>One sort of activity; everything when left out.</summary>
    public ActivityFilter? Filter { get; init; }
}

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
