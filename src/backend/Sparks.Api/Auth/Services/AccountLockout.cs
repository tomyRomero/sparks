using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace Sparks.Api.Auth.Services;

/// <summary>
/// Sign-in lockout. The per-IP rate limit caps one client; this caps attempts
/// on one account from any number of clients. Keys are an account
/// (<see cref="AccountLockout.AccountKey"/>) or an identifier no account has.
/// </summary>
public interface IAccountLockout
{
    AccountLockoutStatus Check(string key);

    /// <summary>Counts a failed attempt and returns the resulting status.</summary>
    AccountLockoutStatus RecordFailure(string key);

    /// <summary>Forgets past failures after a successful sign-in.</summary>
    void Clear(string key);
}

public static class AccountLockout
{
    /// <summary>A space can't appear in a username or email, so this never matches an identifier.</summary>
    public static string AccountKey(long userId) => $"account {userId}";
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
/// In-memory counters for a single instance. Size-limited so made-up
/// identifiers can't exhaust memory.
/// </summary>
public sealed class InMemoryAccountLockout(IOptions<AccountLockoutOptions> options, TimeProvider time)
    : IAccountLockout, IDisposable
{
    private const int MaxTrackedKeys = 100_000;

    private readonly AccountLockoutOptions _options = options.Value;
    private readonly MemoryCache _entries = new(new MemoryCacheOptions { SizeLimit = MaxTrackedKeys });

    public AccountLockoutStatus Check(string key)
    {
        if (!_entries.TryGetValue(Normalize(key), out Entry? entry) || entry is null)
        {
            return AccountLockoutStatus.Open;
        }

        lock (entry)
        {
            return StatusOf(entry, time.GetUtcNow());
        }
    }

    public AccountLockoutStatus RecordFailure(string key)
    {
        var now = time.GetUtcNow();
        var entry = _entries.GetOrCreate(Normalize(key), cacheEntry =>
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

    public void Clear(string key) => _entries.Remove(Normalize(key));

    public void Dispose() => _entries.Dispose();

    private static AccountLockoutStatus StatusOf(Entry entry, DateTimeOffset now) =>
        entry.LockedUntil is { } until && until > now
            ? new AccountLockoutStatus(true, until)
            : AccountLockoutStatus.Open;

    private static string Normalize(string key) => key.Trim().ToLowerInvariant();

    private sealed class Entry
    {
        public int Failures { get; set; }
        public DateTimeOffset WindowEndsAt { get; set; }
        public DateTimeOffset? LockedUntil { get; set; }
    }
}
