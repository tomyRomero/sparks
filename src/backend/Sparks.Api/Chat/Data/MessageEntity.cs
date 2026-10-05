using Sparks.Api.Common.Data;
using Sparks.Api.Posts.Data;
using Sparks.Api.Users.Data;

namespace Sparks.Api.Chat.Data;

/// <summary>One message in a conversation (table <c>messages</c>).</summary>
public class MessageEntity : IHasId
{
    public long Id { get; set; }

    public long ConversationId { get; set; }
    public ConversationEntity Conversation { get; set; } = null!;

    public long SenderId { get; set; }
    public UserEntity Sender { get; set; } = null!;

    /// <summary>The text; empty when the message only shares a spark.</summary>
    public required string Body { get; set; }

    /// <summary>A spark shared in the message. Null for a plain message, and once the spark is deleted.</summary>
    public long? SharedPostId { get; set; }
    public PostEntity? SharedPost { get; set; }

    public DateTime CreatedAt { get; set; }

    /// <summary>When the other participant read it; null while unread.</summary>
    public DateTime? ReadAt { get; set; }
}
