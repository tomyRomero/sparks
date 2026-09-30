using Sparks.Api.Users.Data;

namespace Sparks.Api.Posts.Data;

/// <summary>
/// A comment on a post, or a reply to another comment (table <c>comments</c>).
/// Every comment in a thread keeps the id of the post the thread is on.
/// </summary>
public class CommentEntity
{
    public long Id { get; set; }

    public long PostId { get; set; }
    public PostEntity Post { get; set; } = null!;

    /// <summary>The comment this one replies to; null for a comment directly on the post.</summary>
    public long? ParentCommentId { get; set; }
    public CommentEntity? ParentComment { get; set; }
    public ICollection<CommentEntity> Replies { get; } = [];

    public long AuthorId { get; set; }
    public UserEntity Author { get; set; } = null!;

    public required string Body { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? EditedAt { get; set; }

    public ICollection<CommentLikeEntity> Likes { get; } = [];
}
