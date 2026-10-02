using System.Globalization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Options;
using Sparks.Api.Auth.Services;

namespace Sparks.Api.Common.Security;

/// <summary>
/// Names of the rate-limit policies. The name links a registration to every
/// <c>[EnableRateLimiting]</c>; a mistyped name would silently apply no limit,
/// so both sides use these constants.
/// </summary>
public static class RateLimitPolicies
{
    /// <summary>Credential checks (sign-in, password reset).</summary>
    public const string Login = "login";

    /// <summary>Account creation, the biggest abuse surface.</summary>
    public const string Signup = "signup";

    /// <summary>Cheap but database-touching auth calls (refresh, sign-out).</summary>
    public const string Passive = "passive";

    /// <summary>Image uploads, which take disk space.</summary>
    public const string Uploads = "uploads";

    /// <summary>AI drafts and images, which cost money per call.</summary>
    public const string Ai = "ai";
}

/// <summary>
/// Request limits (configuration section <c>RateLimits</c>): per client IP
/// per minute for the auth endpoints, per member per hour for the costly ones.
/// </summary>
public sealed class RateLimitOptions
{
    public const string SectionName = "RateLimits";

    public int LoginPerMinute { get; set; } = 10;
    public int SignupPerMinute { get; set; } = 5;
    public int PassivePerMinute { get; set; } = 60;
    public int UploadsPerHour { get; set; } = 60;
    public int AiPerHour { get; set; } = 30;
}

public static class RateLimitingServiceCollectionExtensions
{
    /// <summary>
    /// Fixed-window limits (per IP for the auth endpoints, per member for
    /// uploads and AI), and the trust settings that let the limiter see the
    /// real client IP behind the web app's proxy.
    /// </summary>
    public static IServiceCollection AddSparksRateLimiting(
        this IServiceCollection services, IHostEnvironment environment)
    {
        // Development gets roomier defaults for repeated manual testing;
        // configuration overrides either set.
        services.AddOptions<RateLimitOptions>()
            .Configure(options =>
            {
                if (environment.IsDevelopment())
                {
                    options.LoginPerMinute = 50;
                    options.SignupPerMinute = 50;
                    options.PassivePerMinute = 200;
                }
            })
            .BindConfiguration(RateLimitOptions.SectionName);

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.AddPolicy(RateLimitPolicies.Login, context => PerClientIp(context, limits => limits.LoginPerMinute));
            options.AddPolicy(RateLimitPolicies.Signup, context => PerClientIp(context, limits => limits.SignupPerMinute));
            options.AddPolicy(RateLimitPolicies.Passive, context => PerClientIp(context, limits => limits.PassivePerMinute));
            options.AddPolicy(RateLimitPolicies.Uploads, context => PerMember(context, limits => limits.UploadsPerHour));
            options.AddPolicy(RateLimitPolicies.Ai, context => PerMember(context, limits => limits.AiPerHour));
        });

        // Browsers reach the API through the Next.js server, so every request
        // arrives from its address. Trust X-Forwarded-For from one hop, and by
        // default only from loopback (the web app on the same machine), so a
        // client can't pick its own IP by sending the header itself.
        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            options.ForwardLimit = 1;
        });

        return services;
    }

    private static RateLimitPartition<string> PerClientIp(HttpContext context, Func<RateLimitOptions, int> limit) =>
        FixedWindow(context, ClientIp(context), limit, TimeSpan.FromMinutes(1));

    /// <summary>
    /// One allowance per signed-in member, so people behind a shared address
    /// (an office, a VPN) don't share it. Needs authentication to have run.
    /// </summary>
    private static RateLimitPartition<string> PerMember(HttpContext context, Func<RateLimitOptions, int> limit)
    {
        var key = context.User.FindUserId() is { } userId
            ? string.Create(CultureInfo.InvariantCulture, $"user:{userId}")
            : ClientIp(context);
        return FixedWindow(context, key, limit, TimeSpan.FromHours(1));
    }

    /// <summary>The client's address. An unknown address shares one bucket rather than going unlimited.</summary>
    private static string ClientIp(HttpContext context) =>
        $"ip:{context.Connection.RemoteIpAddress?.ToString() ?? "unknown"}";

    private static RateLimitPartition<string> FixedWindow(
        HttpContext context, string partitionKey, Func<RateLimitOptions, int> limit, TimeSpan window)
    {
        var limits = context.RequestServices.GetRequiredService<IOptions<RateLimitOptions>>().Value;
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey,
            _ => new FixedWindowRateLimiterOptions { PermitLimit = limit(limits), Window = window, QueueLimit = 0 });
    }
}
