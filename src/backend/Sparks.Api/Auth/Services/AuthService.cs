using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Sparks.Api.Auth.Data;
using Sparks.Api.Auth.Models;
using Sparks.Api.Common.Data;
using Sparks.Api.Users.Data;

namespace Sparks.Api.Auth.Services;

/// <summary>
/// Sign-up, sign-in, refresh-token rotation and sign-out. Sign-in failures all
/// look the same, so they don't reveal which accounts exist.
/// </summary>
public sealed class AuthService(
    SparksDbContext db,
    TokenService tokens,
    IAccountLockout lockout,
    EndedSessions endedSessions,
    IOptions<JwtOptions> jwtOptions,
    TimeProvider time,
    ILogger<AuthService> logger)
{
    private readonly JwtOptions _jwt = jwtOptions.Value;

    /// <summary>Whether no account has this username, compared without case like the unique index.</summary>
    public async Task<bool> IsUsernameFreeAsync(string username, CancellationToken ct) =>
        !await db.Users.AnyAsync(user => user.Username == username, ct);

    /// <summary>The signed-in member's account; null once it no longer exists.</summary>
    public Task<UserEntity?> FindAccountAsync(long userId, CancellationToken ct) =>
        db.Users.AsNoTracking().SingleOrDefaultAsync(user => user.Id == userId, ct);

    /// <summary>Creates an account and signs it in.</summary>
    /// <exception cref="AccountConflictException">The username or email is taken.</exception>
    public async Task<SignedIn> SignUpAsync(SignupRequest request, ClientInfo client, CancellationToken ct)
    {
        var username = request.Username.Trim();
        var email = request.Email.Trim();

        // Checked first for a clear message; the unique indexes still settle a
        // race between two sign-ups for the same name.
        var taken = await db.Users
            .Where(user => user.Username == username || user.Email == email)
            .Select(user => new { user.Username, user.Email })
            .FirstOrDefaultAsync(ct);
        if (taken is not null)
        {
            throw new AccountConflictException(
                string.Equals(taken.Username, username, StringComparison.OrdinalIgnoreCase)
                    ? AccountConflictException.UsernameField
                    : AccountConflictException.EmailField);
        }

        var now = time.GetUtcNow().UtcDateTime;
        var account = new UserEntity
        {
            Username = username,
            Email = email,
            DisplayName = request.DisplayName.Trim(),
            PasswordHash = Passwords.Hash(request.Password),
            CreatedAt = now,
        };

        try
        {
            var signedIn = await StartSessionAsync(account, client, ct);
            logger.LogInformation("Account {UserId} created", account.Id);
            return signedIn;
        }
        catch (DbUpdateException ex) when (ex.IsUniqueViolation())
        {
            throw new AccountConflictException(
                ex.InnerException!.Message.Contains("username", StringComparison.OrdinalIgnoreCase)
                    ? AccountConflictException.UsernameField
                    : AccountConflictException.EmailField);
        }
    }

    /// <summary>Signs in with an email or username and password.</summary>
    /// <exception cref="AccountLockedException">Too many recent failures for this account.</exception>
    /// <exception cref="UnauthorizedAccessException">The credentials don't match an account.</exception>
    public async Task<SignedIn> SignInAsync(LoginRequest request, ClientInfo client, CancellationToken ct)
    {
        var identifier = request.Identifier.Trim();

        // Usernames can't contain "@", so an identifier matches one column at most.
        var account = await db.Users
            .SingleOrDefaultAsync(user => user.Email == identifier || user.Username == identifier, ct);

        // One budget per account whether it's named by username or email;
        // unknown identifiers lock the same way, so the lock reveals nothing.
        var lockoutKey = account is null ? identifier : AccountLockout.AccountKey(account.Id);
        var status = lockout.Check(lockoutKey);
        if (status.IsLocked)
        {
            throw new AccountLockedException(status.LockedUntil!.Value);
        }

        if (!Passwords.Verify(request.Password, account?.PasswordHash))
        {
            var afterFailure = lockout.RecordFailure(lockoutKey);
            // Never log the identifier: it's personal data, and often a typo of a password.
            logger.LogWarning("Failed sign-in attempt");
            if (afterFailure.IsLocked)
            {
                throw new AccountLockedException(afterFailure.LockedUntil!.Value);
            }

            throw new UnauthorizedAccessException();
        }

        lockout.Clear(lockoutKey);
        return await StartSessionAsync(account!, client, ct);
    }

    /// <summary>
    /// Rotates the refresh token. One of several concurrent refreshes wins; an
    /// old token coming back is treated as stolen and ends all the user's sessions.
    /// </summary>
    /// <exception cref="UnauthorizedAccessException">The token is unknown, expired, revoked or lost a race.</exception>
    public async Task<SignedIn> RefreshAsync(string refreshToken, CancellationToken ct)
    {
        var now = time.GetUtcNow().UtcDateTime;
        var hash = TokenService.Hash(refreshToken);
        var stored = await db.RefreshTokens
            .Include(token => token.Session).ThenInclude(session => session.User)
            .SingleOrDefaultAsync(token => token.TokenHash == hash, ct);

        if (stored is null || stored.ExpiresAt <= now || stored.Session.RevokedAt is not null)
        {
            throw new UnauthorizedAccessException();
        }

        if (stored.RevokedAt is not null)
        {
            return await RefreshRevokedAsync(stored, now, ct);
        }

        await using var transaction = await db.Database.BeginTransactionAsync(ct);

        // Claim the token with a conditional update: of several requests
        // presenting it at once, only the first matches "not yet revoked".
        var claimed = await db.RefreshTokens
            .Where(token => token.Id == stored.Id && token.RevokedAt == null)
            .ExecuteUpdateAsync(set => set.SetProperty(token => token.RevokedAt, now), ct);
        if (claimed == 0)
        {
            await transaction.RollbackAsync(ct);
            await db.Entry(stored).ReloadAsync(ct);
            await db.Entry(stored.Session).ReloadAsync(ct);
            return await RefreshRevokedAsync(stored, now, ct);
        }

        var (rawToken, successorHash) = TokenService.CreateOpaqueToken();
        var successor = new RefreshTokenEntity
        {
            Session = stored.Session,
            TokenHash = successorHash,
            CreatedAt = now,
            ExpiresAt = now + _jwt.RefreshTokenLifetime,
        };
        db.RefreshTokens.Add(successor);
        stored.RevokedAt = now;
        stored.ReplacedBy = successor;
        stored.Session.LastSeenAt = now;

        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        var accessToken = tokens.CreateAccessToken(stored.Session.User, stored.SessionId);
        return new SignedIn(stored.Session.User, accessToken, rawToken);
    }

    /// <summary>
    /// Ends the session a refresh token belongs to. Unknown or already-revoked
    /// tokens are ignored: signing out always succeeds.
    /// </summary>
    public async Task SignOutAsync(string refreshToken, CancellationToken ct)
    {
        var hash = TokenService.Hash(refreshToken);
        var stored = await db.RefreshTokens
            .Include(token => token.Session)
            .SingleOrDefaultAsync(token => token.TokenHash == hash, ct);
        if (stored is null || stored.Session.RevokedAt is not null)
        {
            return;
        }

        var now = time.GetUtcNow().UtcDateTime;
        stored.Session.RevokedAt = now;
        await db.SaveChangesAsync(ct);
        endedSessions.Add([stored.SessionId]);
        await db.RefreshTokens
            .Where(token => token.SessionId == stored.SessionId && token.RevokedAt == null)
            .ExecuteUpdateAsync(set => set.SetProperty(token => token.RevokedAt, now), ct);

        logger.LogInformation("Session {SessionId} signed out", stored.SessionId);
    }

    /// <summary>Ends every active session of a user and revokes their refresh tokens.</summary>
    public async Task RevokeAllSessionsAsync(long userId, CancellationToken ct)
    {
        var now = time.GetUtcNow().UtcDateTime;
        var active = db.Sessions.Where(session => session.UserId == userId && session.RevokedAt == null);
        endedSessions.Add(await active.Select(session => session.Id).ToListAsync(ct));
        await active.ExecuteUpdateAsync(set => set.SetProperty(session => session.RevokedAt, now), ct);
        await db.RefreshTokens
            .Where(token => token.Session.UserId == userId && token.RevokedAt == null)
            .ExecuteUpdateAsync(set => set.SetProperty(token => token.RevokedAt, now), ct);
    }

    /// <summary>
    /// A revoked token came back. Within the grace period of its rotation it's
    /// a request that raced the rotating one (another tab, or a page and its
    /// data calls): it gets an access token, and the refresh cookie the winner
    /// set stays. After that, someone copied the token. Signed-out tokens have
    /// no successor and just fail.
    /// </summary>
    private async Task<SignedIn> RefreshRevokedAsync(RefreshTokenEntity stored, DateTime now, CancellationToken ct)
    {
        if (stored.ReplacedById is null || stored.Session.RevokedAt is not null)
        {
            throw new UnauthorizedAccessException();
        }

        if (now - stored.RevokedAt < _jwt.RotationGracePeriod)
        {
            var user = stored.Session.User;
            return new SignedIn(user, tokens.CreateAccessToken(user, stored.SessionId), RefreshToken: null);
        }

        logger.LogWarning(
            "Refresh token reuse detected for user {UserId}; ending all of their sessions",
            stored.Session.UserId);
        await RevokeAllSessionsAsync(stored.Session.UserId, ct);
        throw new UnauthorizedAccessException();
    }

    /// <summary>Creates a session with its first refresh token, and the access token for it.</summary>
    private async Task<SignedIn> StartSessionAsync(UserEntity account, ClientInfo client, CancellationToken ct)
    {
        var now = time.GetUtcNow().UtcDateTime;
        var (rawToken, hash) = TokenService.CreateOpaqueToken();
        var session = new SessionEntity
        {
            User = account,
            IpAddress = client.IpAddress,
            UserAgent = client.UserAgent,
            CreatedAt = now,
            LastSeenAt = now,
        };
        session.RefreshTokens.Add(new RefreshTokenEntity
        {
            TokenHash = hash,
            CreatedAt = now,
            ExpiresAt = now + _jwt.RefreshTokenLifetime,
        });
        db.Sessions.Add(session);
        await db.SaveChangesAsync(ct);

        return new SignedIn(account, tokens.CreateAccessToken(account, session.Id), rawToken);
    }
}

/// <summary>The result of a successful sign-in or refresh; no refresh token when a refresh lost a race.</summary>
public sealed record SignedIn(UserEntity User, string AccessToken, string? RefreshToken);

/// <summary>Where a sign-in came from, recorded on the session.</summary>
public sealed record ClientInfo(string? IpAddress, string? UserAgent)
{
    public static ClientInfo From(HttpContext context)
    {
        var userAgent = context.Request.Headers.UserAgent.ToString();
        return new ClientInfo(
            context.Connection.RemoteIpAddress?.ToString(),
            string.IsNullOrEmpty(userAgent)
                ? null
                : userAgent[..Math.Min(userAgent.Length, SessionEntityConfiguration.UserAgentMaxLength)]);
    }
}

public sealed class AccountConflictException(string field) : Exception($"The {field} is already in use.")
{
    public const string UsernameField = "username";
    public const string EmailField = "email";

    /// <summary>Which field clashed: <see cref="UsernameField"/> or <see cref="EmailField"/>.</summary>
    public string Field { get; } = field;
}
