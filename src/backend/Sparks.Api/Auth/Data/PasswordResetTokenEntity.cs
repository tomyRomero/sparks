using Sparks.Api.Users.Data;

namespace Sparks.Api.Auth.Data;

/// <summary>
/// A single-use password reset link (table <c>password_reset_tokens</c>).
/// Only the SHA-256 hash is stored; the token itself exists only in the email.
/// </summary>
public class PasswordResetTokenEntity
{
    public long Id { get; set; }

    public long UserId { get; set; }
    public UserEntity User { get; set; } = null!;

    public required string TokenHash { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }

    /// <summary>Set when the link is used or replaced by a newer one. Null while usable.</summary>
    public DateTime? UsedAt { get; set; }
}
