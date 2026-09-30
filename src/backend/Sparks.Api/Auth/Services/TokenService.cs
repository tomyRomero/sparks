using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Sparks.Api.Users.Data;

namespace Sparks.Api.Auth.Services;

/// <summary>
/// Issues and validates tokens: short-lived signed JWT access tokens, and
/// random refresh tokens that are stored only as SHA-256 hashes.
/// </summary>
public sealed class TokenService(IOptions<JwtOptions> options, TimeProvider time)
{
    private readonly JwtOptions _options = options.Value;

    /// <summary>An HMAC-SHA256 JWT naming the user and the session it belongs to.</summary>
    public string CreateAccessToken(UserEntity user, long sessionId)
    {
        var now = time.GetUtcNow().UtcDateTime;
        return new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Issuer = _options.Issuer,
            Audience = _options.Audience,
            IssuedAt = now,
            NotBefore = now,
            Expires = now + _options.AccessTokenLifetime,
            SigningCredentials = new SigningCredentials(SigningKey(_options), SecurityAlgorithms.HmacSha256),
            Claims = new Dictionary<string, object>
            {
                [AuthClaims.UserId] = user.Id.ToString(CultureInfo.InvariantCulture),
                [AuthClaims.SessionId] = sessionId.ToString(CultureInfo.InvariantCulture),
                [AuthClaims.Username] = user.Username,
                [JwtRegisteredClaimNames.Jti] = Guid.NewGuid().ToString(),
            },
        });
    }

    /// <summary>
    /// 256 random bits, URL-safe, plus the hash to store. The raw token goes
    /// only into the user's HttpOnly cookie.
    /// </summary>
    public static (string Token, string Hash) CreateRefreshToken()
    {
        var token = Base64UrlEncoder.Encode(RandomNumberGenerator.GetBytes(32));
        return (token, Hash(token));
    }

    /// <summary>Lower-case hex SHA-256, the form tokens are stored and looked up by.</summary>
    public static string Hash(string token) =>
        Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    /// <summary>What an access token must satisfy: our issuer, audience, key and an unexpired lifetime.</summary>
    public static TokenValidationParameters ValidationParameters(JwtOptions options, TimeProvider time) => new()
    {
        ValidIssuer = options.Issuer,
        ValidAudience = options.Audience,
        IssuerSigningKey = SigningKey(options),
        ValidAlgorithms = [SecurityAlgorithms.HmacSha256],
        // One server issues and checks the tokens, so no clock skew is allowed.
        // The check reads the injected clock so tests can move time forward.
        LifetimeValidator = (notBefore, expires, _, _) =>
        {
            var now = time.GetUtcNow().UtcDateTime;
            return expires is { } end && now < end && (notBefore is not { } start || start <= now);
        },
        NameClaimType = AuthClaims.Username,
    };

    private static SymmetricSecurityKey SigningKey(JwtOptions options) =>
        new(Encoding.UTF8.GetBytes(options.Secret));
}
