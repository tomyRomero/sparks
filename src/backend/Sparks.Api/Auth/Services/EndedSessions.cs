using System.Collections.Concurrent;
using Microsoft.Extensions.Options;

namespace Sparks.Api.Auth.Services;

/// <summary>
/// Sessions that ended while their access tokens were still valid. Requests
/// carrying one are refused, so signing out or resetting a password takes
/// effect at once instead of when the token expires.
/// </summary>
/// <remarks>In memory for a single instance, like the lockout counters.</remarks>
public sealed class EndedSessions(IOptions<JwtOptions> jwt, TimeProvider time)
{
    private readonly ConcurrentDictionary<long, DateTimeOffset> _ended = new();

    public void Add(IEnumerable<long> sessionIds)
    {
        var now = time.GetUtcNow();
        foreach (var (id, until) in _ended)
        {
            if (until <= now)
            {
                _ended.TryRemove(id, out _);
            }
        }

        // Tokens issued for the session can't outlive this.
        var forgetAt = now + jwt.Value.AccessTokenLifetime;
        foreach (var id in sessionIds)
        {
            _ended[id] = forgetAt;
        }
    }

    public bool Contains(long sessionId) =>
        _ended.TryGetValue(sessionId, out var until) && until > time.GetUtcNow();
}
