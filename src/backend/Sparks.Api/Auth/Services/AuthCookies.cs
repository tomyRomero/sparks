using Microsoft.Extensions.Options;
using Sparks.Api.Common;

namespace Sparks.Api.Auth.Services;

/// <summary>
/// The HttpOnly access and refresh cookies. The access token is a cookie too
/// because the web app renders pages on its server.
/// </summary>
/// <remarks>
/// Lax rather than Strict so a link from another site opens signed in.
/// Not Secure in development and tests, which use plain HTTP.
/// </remarks>
public sealed class AuthCookies(IHostEnvironment environment, IOptions<JwtOptions> jwtOptions)
{
    public const string AccessToken = "sparks_access";
    public const string RefreshToken = "sparks_refresh";

    private readonly JwtOptions _jwt = jwtOptions.Value;

    public void Write(HttpResponse response, SignedIn signedIn)
    {
        response.Cookies.Append(AccessToken, signedIn.AccessToken, Options(_jwt.AccessTokenLifetime));
        response.Cookies.Append(RefreshToken, signedIn.RefreshToken, Options(_jwt.RefreshTokenLifetime));
    }

    public void Delete(HttpResponse response)
    {
        response.Cookies.Delete(AccessToken, Options(maxAge: null));
        response.Cookies.Delete(RefreshToken, Options(maxAge: null));
    }

    private CookieOptions Options(TimeSpan? maxAge) => new()
    {
        HttpOnly = true,
        Secure = environment.IsRealEnvironment(),
        SameSite = SameSiteMode.Lax,
        Path = "/",
        MaxAge = maxAge,
        IsEssential = true,
    };
}
