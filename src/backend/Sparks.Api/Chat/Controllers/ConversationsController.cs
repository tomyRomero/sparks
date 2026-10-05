using Microsoft.AspNetCore.Mvc;
using Sparks.Api.Auth.Services;
using Sparks.Api.Chat.Models;
using Sparks.Api.Chat.Services;
using Sparks.Api.Common.Models;

namespace Sparks.Api.Chat.Controllers;

/// <summary>
/// The signed-in member's private conversations. Only the two participants
/// can see or write in a conversation; to anyone else it doesn't exist.
/// </summary>
[ApiController]
[Route("api/v1/conversations")]
public sealed class ConversationsController(ChatService chat) : ControllerBase
{
    /// <summary>The inbox, most recent message first.</summary>
    [HttpGet]
    public Task<OpaqueCursorPage<ConversationResponse>> GetInbox([FromQuery] OpaquePageRequest query, CancellationToken ct) =>
        chat.GetInboxAsync(User.GetUserId(), query, ct);

    /// <summary>Opens the conversation with a member: 201 the first time, 200 after.</summary>
    [HttpPost]
    [ProducesResponseType<ConversationResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ConversationResponse>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Open(StartConversationRequest request, CancellationToken ct)
    {
        var (conversation, created) = await chat.OpenAsync(User.GetUserId(), request.Username.Trim(), ct);
        return created
            ? CreatedAtAction(nameof(Get), new { id = conversation.Id }, conversation)
            : Ok(conversation);
    }

    /// <summary>Messages sent to the member that they haven't read, for a badge.</summary>
    [HttpGet("unread-count")]
    public async Task<UnreadMessages> GetUnreadCount(CancellationToken ct) =>
        new(await chat.CountUnreadAsync(User.GetUserId(), ct));

    /// <summary>One conversation: who it's with, its last message and what's unread.</summary>
    [HttpGet("{id:long}")]
    public Task<ConversationResponse> Get(long id, CancellationToken ct) =>
        chat.GetAsync(id, User.GetUserId(), ct);

    /// <summary>A conversation's messages, newest first.</summary>
    [HttpGet("{id:long}/messages")]
    public Task<CursorPage<MessageResponse>> GetMessages(long id, [FromQuery] PageRequest page, CancellationToken ct) =>
        chat.GetMessagesAsync(id, User.GetUserId(), page, ct);

    [HttpPost("{id:long}/messages")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Send(long id, SendMessageRequest request, CancellationToken ct)
    {
        var message = await chat.SendAsync(id, User.GetUserId(), request, ct);
        return StatusCode(StatusCodes.Status201Created, message);
    }

    [HttpPost("{id:long}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarkRead(long id, MarkMessagesReadRequest request, CancellationToken ct)
    {
        await chat.MarkReadAsync(id, User.GetUserId(), request.UpToMessageId!.Value, ct);
        return NoContent();
    }
}
