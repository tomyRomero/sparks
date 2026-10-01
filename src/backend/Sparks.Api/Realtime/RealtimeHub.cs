using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Sparks.Api.Auth.Services;
using Sparks.Api.Common.Data;
using Sparks.Api.Presence.Services;

namespace Sparks.Api.Realtime;

/// <summary>
/// Each signed-in tab's live connection. Events are addressed by user id, so
/// every tab gets them. Writes go through the REST API and are pushed from
/// there; connections also drive presence.
/// </summary>
[Authorize]
public sealed class RealtimeHub(SparksDbContext db, PresenceService presence) : Hub<IRealtimeClient>
{
    public const string Path = "/hubs/live";

    public override async Task OnConnectedAsync()
    {
        await presence.ConnectedAsync(Context.User!.GetUserId(), Context.ConnectionAborted);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        presence.Disconnected(Context.User!.GetUserId());
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Tells the other participant the caller is typing. Clients send it at
    /// most every few seconds while the member types. A conversation the
    /// caller isn't in is ignored, revealing nothing.
    /// </summary>
    public async Task Typing(long conversationId)
    {
        var userId = Context.User!.GetUserId();
        var otherId = await db.Conversations
            .Where(conversation => conversation.Id == conversationId
                && (conversation.UserAId == userId || conversation.UserBId == userId))
            .Select(conversation => (long?)(conversation.UserAId == userId ? conversation.UserBId : conversation.UserAId))
            .SingleOrDefaultAsync(Context.ConnectionAborted);

        if (otherId is { } recipient)
        {
            await Clients.Member(recipient).Typing(new TypingEvent(conversationId, userId));
        }
    }
}
