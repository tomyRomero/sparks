using Sparks.Api.Activity.Models;
using Sparks.Api.Chat.Models;
using Sparks.Api.Presence.Models;

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

    /// <summary>A member came online or went offline; sent to every signed-in member.</summary>
    Task PresenceChanged(PresenceResponse presence);

    /// <summary>Someone liked or answered the member's post or comment, or followed them.</summary>
    Task ActivityReceived(ActivityNotice notice);
}

/// <summary>Messages read by one participant, for the other's read receipts.</summary>
/// <param name="ReaderId">Who read them.</param>
/// <param name="UpToMessageId">Every message up to this one, from the other participant, is now read.</param>
public sealed record MessagesReadEvent(long ConversationId, long ReaderId, long UpToMessageId, DateTime ReadAt);

/// <summary>A participant typing in a conversation.</summary>
public sealed record TypingEvent(long ConversationId, long UserId);
