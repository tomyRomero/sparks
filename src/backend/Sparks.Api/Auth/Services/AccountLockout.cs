using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace Sparks.Api.Auth.Services;

/// <summary>
/// Per-account sign-in lockout. It complements the per-IP rate limit: the rate
/// limit caps how fast one client can try, and the lockout caps attempts
/// against one account from any number of clients.
/// </summary>
/// <remarks>
/// Keyed by the identifier as typed, whether or not an account exists, so the
/// lockout never reveals which accounts are real.
/// </remarks>
public interface IAccountLockout
{
    AccountLockoutStatus Check(string identifier);

    /// <summary>Counts a failed attempt and returns the resulting status.</summary>
    AccountLockoutStatus RecordFailure(string identifier);

    /// <summary>Forgets past failures after a successful sign-in.</summary>
    void Clear(string identifier);
}

public sealed record AccountLockoutStatus(bool IsLocked, DateTimeOffset? LockedUntil)
{
    public static readonly AccountLockoutStatus Open = new(false, null);
}

/// <summary>Configuration section <c>AccountLockout</c>.</summary>
public sealed class AccountLockoutOptions
{
    public const string SectionName = "AccountLockout";

    /// <summary>Failed attempts within <see cref="AttemptWindow"/> that lock the account.</summary>
    public int AttemptThreshold { get; set; } = 5;

    public TimeSpan AttemptWindow { get; set; } = TimeSpan.FromMinutes(15);

    public TimeSpan LockoutDuration { get; set; } = TimeSpan.FromMinutes(15);
}

public sealed class AccountLockedException(DateTimeOffset lockedUntil)
    : Exception($"Sign-in is locked until {lockedUntil:O}.")
{
    public DateTimeOffset LockedUntil { get; } = lockedUntil;
}

/// <summary>
/// Keeps lockout counters in memory. Sparks runs as one API instance; with
/// several, this would move to a shared store such as Redis behind the same
/// interface. The cache is size-limited so a flood of made-up identifiers
/// can't exhaust memory; the oldest entries are evicted first.
/// </summary>
public sealed class InMemoryAccountLockout(IOptions<AccountLockoutOptions> options, TimeProvider time)
    : IAccountLockout, IDisposable
{
    private const int MaxTrackedIdentifiers = 100_000;

    private readonly AccountLockoutOptions _options = options.Value;
    private readonly MemoryCache _entries = new(new MemoryCacheOptions { SizeLimit = MaxTrackedIdentifiers });

    public AccountLockoutStatus Check(string identifier)
    {
        if (!_entries.TryGetValue(Key(identifier), out Entry? entry) || entry is null)
        {
            return AccountLockoutStatus.Open;
        }

        lock (entry)
        {
            return StatusOf(entry, time.GetUtcNow());
        }
    }

    public AccountLockoutStatus RecordFailure(string identifier)
    {
        var now = time.GetUtcNow();
        var entry = _entries.GetOrCreate(Key(identifier), cacheEntry =>
        {
            cacheEntry.Size = 1;
            // Only for eviction; the timestamps in the entry decide the outcome.
            cacheEntry.SlidingExpiration = _options.AttemptWindow + _options.LockoutDuration;
            return new Entry { WindowEndsAt = now + _options.AttemptWindow };
        })!;

        lock (entry)
        {
            if (StatusOf(entry, now).IsLocked)
            {
                return StatusOf(entry, now);
            }

            // A new window starts once the previous one has passed; it never
            // slides forward with each attempt.
            if (now >= entry.WindowEndsAt)
            {
                entry.Failures = 0;
                entry.WindowEndsAt = now + _options.AttemptWindow;
            }

            entry.Failures++;
            if (entry.Failures >= _options.AttemptThreshold)
            {
                entry.LockedUntil = now + _options.LockoutDuration;
                entry.Failures = 0;
            }

            return StatusOf(entry, now);
        }
    }

    public void Clear(string identifier) => _entries.Remove(Key(identifier));

    public void Dispose() => _entries.Dispose();

    private static AccountLockoutStatus StatusOf(Entry entry, DateTimeOffset now) =>
        entry.LockedUntil is { } until && until > now
            ? new AccountLockoutStatus(true, until)
            : AccountLockoutStatus.Open;

    private static string Key(string identifier) => identifier.Trim().ToLowerInvariant();

    private sealed class Entry
    {
        public int Failures { get; set; }
        public DateTimeOffset WindowEndsAt { get; set; }
        public DateTimeOffset? LockedUntil { get; set; }
    }
}
