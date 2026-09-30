using Sparks.Api.Users.Data;

namespace Sparks.Api.Auth.Data;

/// <summary>
/// One sign-in (table <c>sessions</c>). A session anchors a chain of rotating
/// refresh tokens; revoking it ends that sign-in on its device.
/// </summary>
public class SessionEntity
{
    public long Id { get; set; }

    public long UserId { get; set; }
    public UserEntity User { get; set; } = null!;

    /// <summary>Client IP at sign-in, for the user's own reference. Never re-checked later.</summary>
    public string? IpAddress { get; set; }

    /// <summary>Browser user agent at sign-in, truncated.</summary>
    public string? UserAgent { get; set; }

    public DateTime CreatedAt { get; set; }

    /// <summary>Last successful refresh.</summary>
    public DateTime LastSeenAt { get; set; }

    /// <summary>Set by sign-out, password reset or refresh-token reuse. Null while active.</summary>
    public DateTime? RevokedAt { get; set; }

    public ICollection<RefreshTokenEntity> RefreshTokens { get; } = [];
}
