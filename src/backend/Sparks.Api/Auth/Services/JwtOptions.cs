using System.ComponentModel.DataAnnotations;

namespace Sparks.Api.Auth.Services;

/// <summary>
/// Settings for access and refresh tokens (configuration section <c>Jwt</c>).
/// Validated at startup, so the API refuses to run without a strong key.
/// </summary>
public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    /// <summary>
    /// HMAC-SHA256 signing key, at least 256 bits. Never committed: local
    /// development keeps it in user-secrets (scripts/setup-dev.sh), and a
    /// deployment provides <c>Jwt__Secret</c>.
    /// </summary>
    [Required, MinLength(32)]
    public string Secret { get; set; } = string.Empty;

    [Required]
    public string Issuer { get; set; } = "sparks-api";

    [Required]
    public string Audience { get; set; } = "sparks-web";

    public TimeSpan AccessTokenLifetime { get; set; } = TimeSpan.FromMinutes(30);

    /// <summary>A session ends after this long without a refresh.</summary>
    public TimeSpan RefreshTokenLifetime { get; set; } = TimeSpan.FromDays(30);

    /// <summary>
    /// How long a just-rotated refresh token may come back without counting as
    /// a replay. Server-rendered pages can send a few requests at once with
    /// the same cookie; only one of them wins the rotation.
    /// </summary>
    public TimeSpan RotationGracePeriod { get; set; } = TimeSpan.FromSeconds(30);
}
