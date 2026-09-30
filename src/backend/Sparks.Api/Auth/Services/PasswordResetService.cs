using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Sparks.Api.Auth.Data;
using Sparks.Api.Common;
using Sparks.Api.Common.Data;
using Sparks.Api.Common.Email;

namespace Sparks.Api.Auth.Services;

/// <summary>
/// Forgot-password links: single-use, valid for an hour, stored only as
/// hashes. A reset ends every session, since someone resetting a password may
/// suspect their account is in someone else's hands.
/// </summary>
public sealed class PasswordResetService(
    SparksDbContext db,
    AuthService auth,
    IAccountLockout lockout,
    IEmailSender email,
    IOptions<FrontendOptions> frontend,
    TimeProvider time,
    ILogger<PasswordResetService> logger)
{
    private static readonly TimeSpan LinkLifetime = TimeSpan.FromHours(1);

    /// <summary>
    /// Emails a reset link if the address has an account. Callers answer the
    /// same way either way, so the endpoint can't be used to find accounts.
    /// </summary>
    public async Task RequestResetAsync(string emailAddress, CancellationToken ct)
    {
        var address = emailAddress.Trim();
        var user = await db.Users.SingleOrDefaultAsync(u => u.Email == address, ct);
        if (user is null)
        {
            logger.LogInformation("Password reset requested for an address with no account");
            return;
        }

        var now = time.GetUtcNow().UtcDateTime;

        // Only the newest link works.
        await db.PasswordResetTokens
            .Where(token => token.UserId == user.Id && token.UsedAt == null)
            .ExecuteUpdateAsync(set => set.SetProperty(token => token.UsedAt, now), ct);

        var (rawToken, hash) = TokenService.CreateOpaqueToken();
        db.PasswordResetTokens.Add(new PasswordResetTokenEntity
        {
            UserId = user.Id,
            TokenHash = hash,
            CreatedAt = now,
            ExpiresAt = now + LinkLifetime,
        });
        await db.SaveChangesAsync(ct);

        var link = $"{frontend.Value.BaseUrl.TrimEnd('/')}/reset-password?token={Uri.EscapeDataString(rawToken)}";
        await email.SendAsync(
            new EmailMessage(
                user.Email,
                "Reset your Sparks password",
                $"""
                Hi {user.DisplayName},

                Someone asked to reset the password for your Sparks account. Follow
                this link within the next hour to choose a new one:

                {link}

                If that wasn't you, ignore this email; your password stays the same.
                """),
            ct);

        logger.LogInformation("Password reset link issued for user {UserId}", user.Id);
    }

    /// <summary>Sets a new password from a reset link, then signs the account out everywhere.</summary>
    /// <exception cref="InvalidResetTokenException">The link is unknown, used, replaced or expired.</exception>
    public async Task ResetPasswordAsync(string token, string newPassword, CancellationToken ct)
    {
        var now = time.GetUtcNow().UtcDateTime;
        var hash = TokenService.Hash(token);
        var stored = await db.PasswordResetTokens
            .Include(resetToken => resetToken.User)
            .SingleOrDefaultAsync(resetToken => resetToken.TokenHash == hash, ct);
        if (stored is null || stored.UsedAt is not null || stored.ExpiresAt <= now)
        {
            throw new InvalidResetTokenException();
        }

        // Hashed before the transaction so row locks aren't held during BCrypt.
        var passwordHash = Passwords.Hash(newPassword);

        await using var transaction = await db.Database.BeginTransactionAsync(ct);

        // Claimed with a conditional update, so a link submitted twice at once
        // still works only once.
        var claimed = await db.PasswordResetTokens
            .Where(resetToken => resetToken.Id == stored.Id && resetToken.UsedAt == null)
            .ExecuteUpdateAsync(set => set.SetProperty(resetToken => resetToken.UsedAt, now), ct);
        if (claimed == 0)
        {
            throw new InvalidResetTokenException();
        }

        stored.User.PasswordHash = passwordHash;
        await db.SaveChangesAsync(ct);
        await auth.RevokeAllSessionsAsync(stored.UserId, ct);
        await transaction.CommitAsync(ct);

        // The lockout message points people here, so a reset also unlocks.
        lockout.Clear(stored.User.Email);
        lockout.Clear(stored.User.Username);

        logger.LogInformation("Password reset for user {UserId}; all sessions ended", stored.UserId);
    }
}

public sealed class InvalidResetTokenException() : Exception("The password reset link is invalid or has expired.");
