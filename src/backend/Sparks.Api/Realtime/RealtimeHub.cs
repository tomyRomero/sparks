using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Sparks.Api.Auth.Services;
using Sparks.Api.Common.Data;
using Sparks.Api.Presence.Services;

namespace Sparks.Api.Realtime;

/// <summary>
/// The live connection each signed-in browser keeps open. Events go to
/// members by user id (<see cref="UserIdProvider"/>), so every tab a member
/// has open gets them. Writes such as sending a message go through the REST
/// API, where they're validated and saved, and are pushed from there.
/// Connections opening and closing are what make a member online or not.
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
