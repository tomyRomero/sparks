using Sparks.Api.Users.Data;

namespace Sparks.Api.Posts.Data;

/// <summary>One user's like on one comment (table <c>comment_likes</c>).</summary>
public class CommentLikeEntity
{
    public long CommentId { get; set; }
    public CommentEntity Comment { get; set; } = null!;

    public long UserId { get; set; }
    public UserEntity User { get; set; } = null!;

    public DateTime CreatedAt { get; set; }
}
