using Sparks.Api.Users.Data;

namespace Sparks.Api.Posts.Data;

/// <summary>One user's like on one post (table <c>post_likes</c>).</summary>
public class PostLikeEntity
{
    public long PostId { get; set; }
    public PostEntity Post { get; set; } = null!;

    public long UserId { get; set; }
    public UserEntity User { get; set; } = null!;

    public DateTime CreatedAt { get; set; }
}
