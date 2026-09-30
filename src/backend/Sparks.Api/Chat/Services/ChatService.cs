using System.Linq.Expressions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Sparks.Api.Chat.Data;
using Sparks.Api.Chat.Models;
using Sparks.Api.Common.Data;
using Sparks.Api.Common.Errors;
using Sparks.Api.Common.Models;
using Sparks.Api.Realtime;
using Sparks.Api.Storage;
using Sparks.Api.Users.Models;
using Sparks.Api.Users.Services;

namespace Sparks.Api.Chat.Services;

/// <summary>
/// Private conversations between two members: the inbox, opening a
/// conversation, and sending and reading messages. New messages and read
/// receipts are pushed live to both participants once they're saved.
/// </summary>
public sealed class ChatService(SparksDbContext db, TimeProvider time, IHubContext<RealtimeHub, IRealtimeClient> hub)
{
    /// <summary>
    /// The member's conversations, most recent message first. Conversations
    /// opened but never written in stay out of it.
    /// </summary>
    public async Task<OpaqueCursorPage<ConversationResponse>> GetInboxAsync(
        long userId, OpaquePageRequest query, CancellationToken ct)
    {
        var conversations = db.Conversations.AsNoTracking()
            .Where(conversation => (conversation.UserAId == userId || conversation.UserBId == userId)
                && conversation.Messages.Any());

        if (query.Cursor is not null)
        {
            if (OpaqueCursor.Decode(query.Cursor, partCount: 2) is not [var ticks, var id] || ticks > DateTime.MaxValue.Ticks)
            {
                throw ApiException.BadRequest("INVALID_CURSOR", "That cursor didn't come from this API.");
            }

            var at = new DateTime(ticks, DateTimeKind.Utc);
            conversations = conversations.Where(conversation => conversation.LastMessageAt < at
                || (conversation.LastMessageAt == at && conversation.Id < id));
        }

        var fetched = await conversations
            .OrderByDescending(conversation => conversation.LastMessageAt)
            .ThenByDescending(conversation => conversation.Id)
            .Take(query.Limit + 1)
            .Select(ToConversationResponse(userId))
            .ToListAsync(ct);

        var page = fetched.Take(query.Limit).ToList();
        var nextCursor = fetched.Count > query.Limit
            ? OpaqueCursor.Encode(page[^1].LastMessageAt.Ticks, page[^1].Id)
            : null;
        return new OpaqueCursorPage<ConversationResponse>(page, nextCursor);
    }

    /// <summary>
    /// The conversation with another member, created the first time. The
    /// flag says whether it was just created.
    /// </summary>
    public async Task<(ConversationResponse Conversation, bool Created)> OpenAsync(
        long userId, string username, CancellationToken ct)
    {
        var otherId = await db.Users
            .Where(user => user.Username == username)
            .Select(user => (long?)user.Id)
            .SingleOrDefaultAsync(ct)
            ?? throw UserErrors.UserNotFound();
        if (otherId == userId)
        {
            throw ApiException.BadRequest("CANNOT_MESSAGE_YOURSELF", "You can't start a conversation with yourself.");
        }

        var (userAId, userBId) = ConversationEntity.OrderPair(userId, otherId);
        var created = false;
        var conversationId = await FindPairAsync(userAId, userBId, ct);
        if (conversationId is null)
        {
            var now = time.GetUtcNow().UtcDateTime;
            var conversation = new ConversationEntity
            {
                UserAId = userAId,
                UserBId = userBId,
                CreatedAt = now,
                LastMessageAt = now,
            };
            db.Conversations.Add(conversation);
            try
            {
                await db.SaveChangesAsync(ct);
                conversationId = conversation.Id;
                created = true;
            }
            catch (DbUpdateException ex) when (ex.IsUniqueViolation())
            {
                // The other member opened it at the same moment; use theirs.
                db.ChangeTracker.Clear();
                conversationId = await FindPairAsync(userAId, userBId, ct);
            }
        }

        return (await GetAsync(conversationId!.Value, userId, ct), created);
    }

    /// <summary>A conversation's messages, newest first, for one of its participants.</summary>
    public async Task<CursorPage<MessageResponse>> GetMessagesAsync(
        long conversationId, long userId, PageRequest page, CancellationToken ct)
    {
        await FindOtherParticipantAsync(conversationId, userId, ct);
        var fetched = await db.Messages.AsNoTracking()
            .Where(message => message.ConversationId == conversationId)
            .NewestFirst(page)
            .Select(ToMessageResponse)
            .ToListAsync(ct);
        return CursorPage.From(fetched, page.Limit, message => message.Id);
    }

    /// <summary>Saves a message, then pushes it to both participants' open tabs.</summary>
    public async Task<MessageResponse> SendAsync(
        long conversationId, long senderId, SendMessageRequest request, CancellationToken ct)
    {
        var recipientId = await FindOtherParticipantAsync(conversationId, senderId, ct);
        var message = new MessageEntity
        {
            ConversationId = conversationId,
            SenderId = senderId,
            Body = request.Body.Trim(),
            CreatedAt = time.GetUtcNow().UtcDateTime,
        };

        // The message and the inbox order change together. The inbox time
        // only moves forward, in case a message sent a moment later commits
        // first.
        await using (var transaction = await db.Database.BeginTransactionAsync(ct))
        {
            db.Messages.Add(message);
            await db.SaveChangesAsync(ct);
            await db.Conversations
                .Where(conversation => conversation.Id == conversationId && conversation.LastMessageAt < message.CreatedAt)
                .ExecuteUpdateAsync(set => set.SetProperty(conversation => conversation.LastMessageAt, message.CreatedAt), ct);
            await transaction.CommitAsync(ct);
        }

        var response = MessageResponseOf(message);
        await hub.Clients.Members(senderId, recipientId).MessageReceived(response);
        return response;
    }

    /// <summary>
    /// Marks the other participant's messages as read up to one the member
    /// has seen, and tells the sender. Later messages stay unread.
    /// </summary>
    public async Task MarkReadAsync(long conversationId, long userId, long upToMessageId, CancellationToken ct)
    {
        var senderId = await FindOtherParticipantAsync(conversationId, userId, ct);
        DateTime? readAt = time.GetUtcNow().UtcDateTime;
        var marked = await db.Messages
            .Where(message => message.ConversationId == conversationId
                && message.SenderId == senderId
                && message.ReadAt == null
                && message.Id <= upToMessageId)
            .ExecuteUpdateAsync(set => set.SetProperty(message => message.ReadAt, readAt), ct);

        if (marked > 0)
        {
            await hub.Clients.Member(senderId)
                .MessagesRead(new MessagesReadEvent(conversationId, userId, upToMessageId, readAt.Value));
        }
    }

    /// <summary>Messages sent to the member that they haven't read, across all conversations.</summary>
    public Task<int> CountUnreadAsync(long userId, CancellationToken ct) =>
        db.Messages.CountAsync(
            message => message.SenderId != userId
                && message.ReadAt == null
                && (message.Conversation.UserAId == userId || message.Conversation.UserBId == userId),
            ct);

    private async Task<ConversationResponse> GetAsync(long conversationId, long userId, CancellationToken ct) =>
        await db.Conversations.AsNoTracking()
            .Where(conversation => conversation.Id == conversationId)
            .Select(ToConversationResponse(userId))
            .SingleOrDefaultAsync(ct)
        ?? throw ConversationNotFound();

    private Task<long?> FindPairAsync(long userAId, long userBId, CancellationToken ct) =>
        db.Conversations
            .Where(conversation => conversation.UserAId == userAId && conversation.UserBId == userBId)
            .Select(conversation => (long?)conversation.Id)
            .SingleOrDefaultAsync(ct);

    /// <summary>
    /// The other participant's id. Someone outside the conversation gets the
    /// same 404 as for one that doesn't exist, so ids reveal nothing.
    /// </summary>
    private async Task<long> FindOtherParticipantAsync(long conversationId, long userId, CancellationToken ct) =>
        await db.Conversations
            .Where(conversation => conversation.Id == conversationId
                && (conversation.UserAId == userId || conversation.UserBId == userId))
            .Select(conversation => (long?)(conversation.UserAId == userId ? conversation.UserBId : conversation.UserAId))
            .SingleOrDefaultAsync(ct)
        ?? throw ConversationNotFound();

    /// <summary>A conversation from one participant's side, with counts computed in SQL.</summary>
    private static Expression<Func<ConversationEntity, ConversationResponse>> ToConversationResponse(long viewerId) =>
        conversation => new ConversationResponse(
            conversation.Id,
            new UserSummary(
                conversation.UserAId == viewerId ? conversation.UserBId : conversation.UserAId,
                conversation.UserAId == viewerId ? conversation.UserB.Username : conversation.UserA.Username,
                conversation.UserAId == viewerId ? conversation.UserB.DisplayName : conversation.UserA.DisplayName,
                FileUrls.Of(conversation.UserAId == viewerId ? conversation.UserB.AvatarKey : conversation.UserA.AvatarKey)),
            conversation.Messages
                .OrderByDescending(message => message.Id)
                .Select(message => new MessageResponse(
                    message.Id, message.ConversationId, message.SenderId, message.Body, message.CreatedAt, message.ReadAt))
                .FirstOrDefault(),
            conversation.Messages.Count(message => message.SenderId != viewerId && message.ReadAt == null),
            conversation.LastMessageAt);

    private static readonly Expression<Func<MessageEntity, MessageResponse>> ToMessageResponse =
        message => new MessageResponse(
            message.Id, message.ConversationId, message.SenderId, message.Body, message.CreatedAt, message.ReadAt);

    /// <summary>The same mapping for a message already in memory, compiled once.</summary>
    private static readonly Func<MessageEntity, MessageResponse> MessageResponseOf = ToMessageResponse.Compile();

    private static ApiException ConversationNotFound() =>
        ApiException.NotFound("CONVERSATION_NOT_FOUND", "That conversation doesn't exist.");
}
