using Sparks.Api.Common.Data;
using Sparks.Api.Users.Data;

namespace Sparks.Api.Posts.Data;

/// <summary>A top-level spark (table <c>posts</c>).</summary>
public class PostEntity : IHasId
{
    public long Id { get; set; }

    public long AuthorId { get; set; }
    public UserEntity Author { get; set; } = null!;

    public SparkKind Kind { get; set; }

    public required string Body { get; set; }

    /// <summary>Storage key of the attached image, if any.</summary>
    public string? ImageKey { get; set; }

    /// <summary>The prompt the AI draft was generated from; null for hand-written sparks.</summary>
    public string? AiPrompt { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? EditedAt { get; set; }

    public ICollection<CommentEntity> Comments { get; } = [];
    public ICollection<PostLikeEntity> Likes { get; } = [];
}
