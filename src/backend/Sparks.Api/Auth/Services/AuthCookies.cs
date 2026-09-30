using Microsoft.Extensions.Options;
using Sparks.Api.Common;

namespace Sparks.Api.Auth.Services;

/// <summary>
/// The two HttpOnly cookies that carry a browser's sign-in. The web app
/// renders pages on its server, so the access token travels in a cookie as
/// well as the refresh token; neither is ever readable by page scripts.
/// </summary>
/// <remarks>
/// <c>SameSite=Lax</c> rather than Strict: a signed-in user who follows a link
/// to Sparks from another site gets a signed-in page, while other sites still
/// can't make cookie-carrying POSTs. Secure everywhere except local
/// development and tests, which run over plain HTTP.
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
