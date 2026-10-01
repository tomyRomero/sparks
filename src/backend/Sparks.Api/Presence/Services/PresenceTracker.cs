using Microsoft.Extensions.Options;

namespace Sparks.Api.Presence.Services;

/// <summary>
/// Who is connected right now, counted in this instance's memory. A member
/// with three tabs open has three connections. They're online while any is
/// open, and for <see cref="PresenceOptions.OfflineAfter"/> after the last
/// one closes.
/// </summary>
/// <remarks>
/// Memory is enough while the API runs as one instance. Several instances
/// would keep the counts in a shared store such as Redis, as SignalR itself
/// would then need a backplane.
/// </remarks>
public sealed class PresenceTracker(TimeProvider time, IOptions<PresenceOptions> options)
{
    private readonly Lock _gate = new();
    private readonly Dictionary<long, Connections> _members = [];

    /// <summary>Counts a new connection. True when the member wasn't online until now.</summary>
    public bool Connect(long userId)
    {
        lock (_gate)
        {
            if (_members.TryGetValue(userId, out var member))
            {
                member.Open++;
                member.LastClosedAt = null;
                return false;
            }

            _members[userId] = new Connections { Open = 1 };
            return true;
        }
    }

    /// <summary>Counts a closed connection. Closing the last one starts the grace period.</summary>
    public void Disconnect(long userId)
    {
        lock (_gate)
        {
            if (_members.TryGetValue(userId, out var member) && --member.Open == 0)
            {
                member.LastClosedAt = time.GetUtcNow();
            }
        }
    }

    public bool IsOnline(long userId)
    {
        lock (_gate)
        {
            return _members.ContainsKey(userId);
        }
    }

    public long[] OnlineIds()
    {
        lock (_gate)
        {
            return [.. _members.Keys];
        }
    }

    /// <summary>
    /// The members whose grace period is over, with when their last
    /// connection closed. They're forgotten as they're returned, so each
    /// departure is reported once.
    /// </summary>
    public IReadOnlyList<Departure> TakeDepartures()
    {
        var cutoff = time.GetUtcNow() - options.Value.OfflineAfter;
        lock (_gate)
        {
            List<Departure> departures = [];
            foreach (var (userId, member) in _members)
            {
                if (member.LastClosedAt is { } closedAt && closedAt <= cutoff)
                {
                    departures.Add(new Departure(userId, closedAt.UtcDateTime));
                }
            }

            foreach (var departure in departures)
            {
                _members.Remove(departure.UserId);
            }

            return departures;
        }
    }

    private sealed class Connections
    {
        public int Open;

        /// <summary>When the last open connection closed; null while one is open.</summary>
        public DateTimeOffset? LastClosedAt;
    }
}

/// <summary>A member who went offline, and when their last connection closed.</summary>
public readonly record struct Departure(long UserId, DateTime LeftAt);
