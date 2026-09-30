using System.ComponentModel.DataAnnotations;
using Sparks.Api.Common.Constants;
using Sparks.Api.Users.Models;

namespace Sparks.Api.Chat.Models;

/// <summary>A conversation as the inbox shows it, from the viewer's side.</summary>
/// <param name="With">The other participant.</param>
/// <param name="LastMessage">Null until the first message is sent.</param>
/// <param name="UnreadCount">Messages from the other participant the viewer hasn't read.</param>
/// <param name="LastMessageAt">When the newest message was sent; the inbox is ordered by it.</param>
public sealed record ConversationResponse(
    long Id,
    UserSummary With,
    MessageResponse? LastMessage,
    int UnreadCount,
    DateTime LastMessageAt);

/// <param name="ReadAt">When the recipient read it; null while unread.</param>
public sealed record MessageResponse(
    long Id,
    long ConversationId,
    long SenderId,
    string Body,
    DateTime CreatedAt,
    DateTime? ReadAt);

/// <summary>Opens the conversation with a member, creating it the first time.</summary>
public sealed record StartConversationRequest
{
    [Required, StringLength(InputLimits.UsernameMaxLength)]
    public string Username { get; init; } = string.Empty;
}

public sealed record SendMessageRequest
{
    [Required, StringLength(InputLimits.MessageBodyMaxLength)]
    public string Body { get; init; } = string.Empty;
}

public sealed record MarkMessagesReadRequest
{
    /// <summary>
    /// The newest message the viewer has seen. Later ones stay unread, so a
    /// message that arrives while the chat is open isn't marked read unseen.
    /// </summary>
    [Required, Range(1, long.MaxValue)]
    public long? UpToMessageId { get; init; }
}

public sealed record UnreadMessages(int Count);
