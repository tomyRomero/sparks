using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Sparks.Api.Common.Data;
using Sparks.Api.Presence.Models;
using Sparks.Api.Realtime;
using Sparks.Api.Storage;
using Sparks.Api.Users.Models;

namespace Sparks.Api.Presence.Services;

/// <summary>
/// Who's online. The live connection reports members arriving and leaving,
/// every signed-in member hears about it, and the last time each member was
/// seen is kept for when they're away.
/// </summary>
public sealed class PresenceService(
    SparksDbContext db,
    PresenceTracker tracker,
    TimeProvider time,
    IHubContext<RealtimeHub, IRealtimeClient> hub,
    ILogger<PresenceService> logger)
{
    /// <summary>How far back "who's around" looks for members who aren't online.</summary>
    public static readonly TimeSpan AroundWindow = TimeSpan.FromDays(7);

    /// <summary>
    /// A connection opened. If it's the member's only one, they've just come
    /// online: they're seen now, and everyone signed in is told.
    /// </summary>
    public async Task ConnectedAsync(long userId, CancellationToken ct)
    {
        if (!tracker.Connect(userId))
        {
            return;
        }

        try
        {
            var now = time.GetUtcNow().UtcDateTime;
            await TrySetLastSeenAsync(userId, now, ct);
            await hub.Clients.All.PresenceChanged(new PresenceResponse(userId, true, now));
        }
        catch
        {
            // The connection never opens, so OnDisconnectedAsync won't run for it.
            tracker.Disconnect(userId);
            throw;
        }
    }

    public void Disconnected(long userId) => tracker.Disconnect(userId);

    /// <summary>
    /// Marks offline the members whose grace period is over: keeps when each
    /// was last seen, and tells everyone signed in.
    /// </summary>
    public async Task SweepAsync(CancellationToken ct)
    {
        foreach (var (userId, leftAt) in tracker.TakeDepartures())
        {
            await TrySetLastSeenAsync(userId, leftAt, ct);

            // Back already, in the moment since: their return was announced instead.
            if (!tracker.IsOnline(userId))
            {
                await hub.Clients.All.PresenceChanged(new PresenceResponse(userId, false, leftAt));
            }
        }
    }

    /// <summary>Whether each member is online, and when they last were. Ids of no member are left out.</summary>
    public async Task<IReadOnlyList<PresenceResponse>> GetAsync(IReadOnlyCollection<long> userIds, CancellationToken ct)
    {
        var members = await db.Users.AsNoTracking()
            .Where(user => userIds.Contains(user.Id))
            .Select(user => new { user.Id, user.LastSeenAt })
            .ToListAsync(ct);
        return [.. members.Select(member => new PresenceResponse(member.Id, tracker.IsOnline(member.Id), member.LastSeenAt))];
    }

    /// <summary>
    /// A few members who are around, never the viewer: everyone online
    /// first, then whoever was seen most recently in the last week.
    /// </summary>
    public async Task<IReadOnlyList<MemberPresenceResponse>> GetAroundAsync(long viewerId, int limit, CancellationToken ct)
    {
        var online = tracker.OnlineIds();
        var since = time.GetUtcNow().UtcDateTime - AroundWindow;
        var members = await db.Users.AsNoTracking()
            .Where(user => user.Id != viewerId && (online.Contains(user.Id) || user.LastSeenAt >= since))
            .OrderByDescending(user => online.Contains(user.Id))
            .ThenByDescending(user => user.LastSeenAt)
            .ThenBy(user => user.Id)
            .Take(limit)
            .Select(user => new
            {
                Summary = new UserSummary(user.Id, user.Username, user.DisplayName, FileUrls.Of(user.AvatarKey)),
                user.LastSeenAt,
            })
            .ToListAsync(ct);
        return [.. members.Select(member =>
            new MemberPresenceResponse(member.Summary, tracker.IsOnline(member.Summary.Id), member.LastSeenAt))];
    }

    /// <summary>
    /// Moves the member's last-seen time forward, never back, in case a
    /// return and a departure are written out of order. Presence is a nicety:
    /// a failure here is logged, never passed on to the connection.
    /// </summary>
    private async Task TrySetLastSeenAsync(long userId, DateTime seenAt, CancellationToken ct)
    {
        DateTime? value = seenAt;
        try
        {
            await db.Users
                .Where(user => user.Id == userId && (user.LastSeenAt == null || user.LastSeenAt < seenAt))
                .ExecuteUpdateAsync(set => set.SetProperty(user => user.LastSeenAt, value), ct);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Couldn't save when member {UserId} was last seen", userId);
        }
    }
}
