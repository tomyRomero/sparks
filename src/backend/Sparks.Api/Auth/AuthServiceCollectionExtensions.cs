using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using Microsoft.Net.Http.Headers;
using Sparks.Api.Auth.Services;

namespace Sparks.Api.Auth;

public static class AuthServiceCollectionExtensions
{
    /// <summary>
    /// Token issuing, JWT validation, the account lockout, and a fallback
    /// policy that makes every endpoint require a signed-in user unless it is
    /// marked <c>[AllowAnonymous]</c>.
    /// </summary>
    public static IServiceCollection AddSparksAuth(this IServiceCollection services)
    {
        services.AddOptions<JwtOptions>()
            .BindConfiguration(JwtOptions.SectionName)
            .ValidateDataAnnotations()
            .ValidateOnStart();
        services.AddOptions<AccountLockoutOptions>().BindConfiguration(AccountLockoutOptions.SectionName);

        services.AddSingleton<TokenService>();
        services.AddSingleton<AuthCookies>();
        services.AddSingleton<IAccountLockout, InMemoryAccountLockout>();
        services.AddScoped<AuthService>();
        services.AddScoped<PasswordResetService>();

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();

        // Configured from the validated options when first needed, not while
        // the app is being built, so every host (including tests) supplies its
        // own key through ordinary configuration.
        services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Configure<IOptions<JwtOptions>, TimeProvider>((bearer, jwt, time) =>
            {
                // Keep claim names as issued ("sub", "sid") instead of mapping
                // them to long XML-schema URIs.
                bearer.MapInboundClaims = false;
                bearer.TokenValidationParameters = TokenService.ValidationParameters(jwt.Value, time);
                bearer.Events = new JwtBearerEvents
                {
                    // Server-rendered pages forward the token in the
                    // Authorization header; browser calls carry the cookie.
                    OnMessageReceived = context =>
                    {
                        if (!context.Request.Headers.ContainsKey(HeaderNames.Authorization))
                        {
                            context.Token = context.Request.Cookies[AuthCookies.AccessToken];
                        }

                        return Task.CompletedTask;
                    },
                };
            });

        services.AddAuthorizationBuilder()
            .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());

        return services;
    }
}
