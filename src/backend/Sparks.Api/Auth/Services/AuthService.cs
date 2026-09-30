using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Sparks.Api.Auth.Data;
using Sparks.Api.Auth.Models;
using Sparks.Api.Common.Data;
using Sparks.Api.Users.Data;

namespace Sparks.Api.Auth.Services;

/// <summary>
/// Account creation, sign-in, refresh-token rotation and sign-out.
/// </summary>
/// <remarks>
/// Every sign-in failure surfaces as one generic error, whatever the cause, so
/// callers can't learn which emails or usernames exist.
/// </remarks>
public sealed class AuthService(
    SparksDbContext db,
    TokenService tokens,
    IAccountLockout lockout,
    IOptions<JwtOptions> jwtOptions,
    TimeProvider time,
    ILogger<AuthService> logger)
{
    private readonly JwtOptions _jwt = jwtOptions.Value;

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
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 } sql)
        {
            throw new AccountConflictException(
                sql.Message.Contains("username", StringComparison.OrdinalIgnoreCase)
                    ? AccountConflictException.UsernameField
                    : AccountConflictException.EmailField);
        }
    }

    /// <summary>Signs in with an email or username and password.</summary>
    /// <exception cref="AccountLockedException">Too many recent failures for this identifier.</exception>
    /// <exception cref="UnauthorizedAccessException">The credentials don't match an account.</exception>
    public async Task<SignedIn> SignInAsync(LoginRequest request, ClientInfo client, CancellationToken ct)
    {
        var identifier = request.Identifier.Trim();

        // Checked before touching the database, so a locked identifier answers
        // the same way whether or not the account exists.
        var status = lockout.Check(identifier);
        if (status.IsLocked)
        {
            throw new AccountLockedException(status.LockedUntil!.Value);
        }

        // Usernames can't contain "@", so an identifier matches one column at most.
        var account = await db.Users
            .SingleOrDefaultAsync(user => user.Email == identifier || user.Username == identifier, ct);

        if (!Passwords.Verify(request.Password, account?.PasswordHash))
        {
            var afterFailure = lockout.RecordFailure(identifier);
            // Never log the identifier: it's personal data, and often a typo of a password.
            logger.LogWarning("Failed sign-in attempt");
            if (afterFailure.IsLocked)
            {
                throw new AccountLockedException(afterFailure.LockedUntil!.Value);
            }

            throw new UnauthorizedAccessException();
        }

        lockout.Clear(identifier);
        return await StartSessionAsync(account!, client, ct);
    }

    /// <summary>
    /// Exchanges a refresh token for a new access token and a new refresh
    /// token. Exactly one of several concurrent refreshes with the same token
    /// wins; a token that was rotated a while ago and comes back is treated as
    /// stolen, and every session of its user ends.
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

        if (stored.RevokedAt is { } revokedAt)
        {
            await HandleReuseAsync(stored, revokedAt, now, ct);
            throw new UnauthorizedAccessException();
        }

        await using var transaction = await db.Database.BeginTransactionAsync(ct);

        // Claim the token with a conditional update: of several requests
        // presenting it at once, only the first matches "not yet revoked".
        var claimed = await db.RefreshTokens
            .Where(token => token.Id == stored.Id && token.RevokedAt == null)
            .ExecuteUpdateAsync(set => set.SetProperty(token => token.RevokedAt, now), ct);
        if (claimed == 0)
        {
            throw new UnauthorizedAccessException();
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
        await db.RefreshTokens
            .Where(token => token.SessionId == stored.SessionId && token.RevokedAt == null)
            .ExecuteUpdateAsync(set => set.SetProperty(token => token.RevokedAt, now), ct);

        logger.LogInformation("Session {SessionId} signed out", stored.SessionId);
    }

    /// <summary>Ends every active session of a user and revokes their refresh tokens.</summary>
    public async Task RevokeAllSessionsAsync(long userId, CancellationToken ct)
    {
        var now = time.GetUtcNow().UtcDateTime;
        await db.Sessions
            .Where(session => session.UserId == userId && session.RevokedAt == null)
            .ExecuteUpdateAsync(set => set.SetProperty(session => session.RevokedAt, now), ct);
        await db.RefreshTokens
            .Where(token => token.Session.UserId == userId && token.RevokedAt == null)
            .ExecuteUpdateAsync(set => set.SetProperty(token => token.RevokedAt, now), ct);
    }

    /// <summary>
    /// A revoked token came back. If it was rotated moments ago, another
    /// request with the same cookie simply got there first. If it was rotated
    /// earlier, the only way to hold it is to have copied it before it was
    /// replaced, so it is treated as stolen. Tokens revoked by sign-out have
    /// no successor and just fail.
    /// </summary>
    private async Task HandleReuseAsync(RefreshTokenEntity stored, DateTime revokedAt, DateTime now, CancellationToken ct)
    {
        if (stored.ReplacedById is null || now - revokedAt < _jwt.RotationGracePeriod)
        {
            return;
        }

        logger.LogWarning(
            "Refresh token reuse detected for user {UserId}; ending all of their sessions",
            stored.Session.UserId);
        await RevokeAllSessionsAsync(stored.Session.UserId, ct);
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

/// <summary>The result of a successful sign-in or refresh.</summary>
public sealed record SignedIn(UserEntity User, string AccessToken, string RefreshToken);

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
