namespace Sparks.Api.Auth.Data;

/// <summary>
/// One refresh token in a session's rotation chain (table <c>refresh_tokens</c>).
/// Only the SHA-256 hash is stored; the token itself lives in the user's
/// HttpOnly cookie.
/// </summary>
public class RefreshTokenEntity
{
    public long Id { get; set; }

    public long SessionId { get; set; }
    public SessionEntity Session { get; set; } = null!;

    /// <summary>Lower-case hex SHA-256 of the token.</summary>
    public required string TokenHash { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }

    /// <summary>Set when the token is rotated or its session ends. Null while usable.</summary>
    public DateTime? RevokedAt { get; set; }

    /// <summary>
    /// The token this one was rotated into. Set only by rotation, never by
    /// sign-out, so a revoked token with a successor that comes back is a
    /// replay (a stolen cookie), not a stale tab after sign-out.
    /// </summary>
    public long? ReplacedById { get; set; }
    public RefreshTokenEntity? ReplacedBy { get; set; }
}
