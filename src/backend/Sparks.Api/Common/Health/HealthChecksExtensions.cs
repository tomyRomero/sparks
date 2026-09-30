using System.Text.Json;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Sparks.Api.Common.Data;

namespace Sparks.Api.Common.Health;

/// <summary>
/// Health checks for load balancers and monitors. Registration and endpoint
/// mapping live together so the checks and what the probes return can't drift.
/// </summary>
public static class HealthChecksExtensions
{
    /// <summary>Tag for checks that must pass before the API takes traffic.</summary>
    public const string ReadyTag = "ready";

    public static IServiceCollection AddSparksHealthChecks(this IServiceCollection services)
    {
        services.AddHealthChecks()
            .AddDbContextCheck<SparksDbContext>("database", tags: [ReadyTag]);
        return services;
    }

    /// <summary>
    /// Maps <c>/health/live</c> (the process is up; runs no checks) and
    /// <c>/health/ready</c> (every check tagged <see cref="ReadyTag"/> passes).
    /// Both are anonymous, so responses carry names and statuses only, never the
    /// exception text that could reveal a server address.
    /// </summary>
    public static WebApplication MapSparksHealthEndpoints(this WebApplication app)
    {
        app.MapHealthChecks("/health/live", new HealthCheckOptions
        {
            Predicate = _ => false,
            ResponseWriter = WriteJsonAsync,
        });

        app.MapHealthChecks("/health/ready", new HealthCheckOptions
        {
            Predicate = check => check.Tags.Contains(ReadyTag),
            ResponseWriter = WriteJsonAsync,
        });

        return app;
    }

    private static Task WriteJsonAsync(HttpContext context, HealthReport report)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        var body = new
        {
            status = report.Status.ToString(),
            checks = report.Entries.Select(entry => new
            {
                name = entry.Key,
                status = entry.Value.Status.ToString(),
            }),
        };
        return context.Response.WriteAsync(JsonSerializer.Serialize(body));
    }
}
