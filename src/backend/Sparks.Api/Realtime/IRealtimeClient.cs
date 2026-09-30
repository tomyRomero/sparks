using Sparks.Api.Chat.Models;

namespace Sparks.Api.Realtime;

/// <summary>The events the server pushes to connected browsers.</summary>
public interface IRealtimeClient
{
    /// <summary>A new message in one of the member's conversations, sent to both participants.</summary>
    Task MessageReceived(MessageResponse message);

    /// <summary>The other participant read the member's messages up to a point.</summary>
    Task MessagesRead(MessagesReadEvent read);

    /// <summary>The other participant is typing.</summary>
    Task Typing(TypingEvent typing);
}

/// <param name="ReaderId">Who read them.</param>
/// <param name="UpToMessageId">Every message up to this one, from the other participant, is now read.</param>
public sealed record MessagesReadEvent(long ConversationId, long ReaderId, long UpToMessageId, DateTime ReadAt);

public sealed record TypingEvent(long ConversationId, long UserId);
