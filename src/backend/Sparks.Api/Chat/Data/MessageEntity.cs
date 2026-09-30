using Sparks.Api.Users.Data;

namespace Sparks.Api.Chat.Data;

/// <summary>One message in a conversation (table <c>messages</c>).</summary>
public class MessageEntity
{
    public long Id { get; set; }

    public long ConversationId { get; set; }
    public ConversationEntity Conversation { get; set; } = null!;

    public long SenderId { get; set; }
    public UserEntity Sender { get; set; } = null!;

    public required string Body { get; set; }

    public DateTime CreatedAt { get; set; }

    /// <summary>When the other participant read it; null while unread.</summary>
    public DateTime? ReadAt { get; set; }
}
