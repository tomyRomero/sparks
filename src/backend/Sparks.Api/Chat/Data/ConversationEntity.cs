using Sparks.Api.Users.Data;

namespace Sparks.Api.Chat.Data;

/// <summary>
/// A private conversation between two users (table <c>conversations</c>).
/// The pair is stored in a fixed order (<see cref="UserAId"/> is the lower
/// id), so each pair of users has at most one conversation.
/// </summary>
public class ConversationEntity
{
    public long Id { get; set; }

    public long UserAId { get; set; }
    public UserEntity UserA { get; set; } = null!;

    public long UserBId { get; set; }
    public UserEntity UserB { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    /// <summary>Time of the newest message, which orders the inbox.</summary>
    public DateTime LastMessageAt { get; set; }

    public ICollection<MessageEntity> Messages { get; } = [];

    /// <summary>Puts two user ids in the order this table stores them.</summary>
    public static (long UserAId, long UserBId) OrderPair(long first, long second) =>
        first < second ? (first, second) : (second, first);
}
