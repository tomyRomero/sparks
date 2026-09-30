using Microsoft.AspNetCore.Mvc.ModelBinding.Metadata;
using Serilog;
using Sparks.Api.Auth;
using Sparks.Api.Common;
using Sparks.Api.Common.Data;
using Sparks.Api.Common.Email;
using Sparks.Api.Common.Health;
using Sparks.Api.Common.Security;

// Logs anything that goes wrong before the host (and its configured logger) is built.
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // ── Logging ──────────────────────────────────────────────────────────────
    // preserveStaticLogger keeps the static bootstrap logger separate from the
    // host's logger. Without it, Serilog freezes the shared static logger, and
    // two hosts starting at once (parallel integration tests) fail.
    builder.Host.UseSerilog(
        (context, services, logger) => logger
            .ReadFrom.Configuration(context.Configuration)
            .ReadFrom.Services(services)
            .Enrich.FromLogContext()
            .WriteTo.Console(),
        preserveStaticLogger: true);

    // ── Errors ───────────────────────────────────────────────────────────────
    // Every error response is RFC 9457 problem details, including unhandled
    // exceptions (a generic 500, never a stack trace) and bare status codes
    // such as 404 and 405.
    builder.Services.AddProblemDetails();

    // ── Database ─────────────────────────────────────────────────────────────
    builder.Services.AddSparksDatabase();

    // ── Email ────────────────────────────────────────────────────────────────
    builder.Services.AddOptions<FrontendOptions>()
        .BindConfiguration(FrontendOptions.SectionName)
        .ValidateDataAnnotations()
        .ValidateOnStart();
    builder.Services.AddSingleton<IEmailSender, LoggingEmailSender>();

    // ── Security ─────────────────────────────────────────────────────────────
    // One clock for everything time-based (token lifetimes, lockouts), so
    // tests can move it forward.
    builder.Services.AddSingleton(TimeProvider.System);
    builder.Services.AddSparksAuth();
    builder.Services.AddSparksRateLimiting(builder.Environment);

    // ── API ──────────────────────────────────────────────────────────────────
    // Don't advertise the web server in every response.
    builder.WebHost.ConfigureKestrel(kestrel => kestrel.AddServerHeader = false);
    // Validation errors are keyed by JSON field name ("email"), not the C#
    // property name ("Email"), so the frontend can map them to its inputs.
    builder.Services.AddControllers(mvc =>
        mvc.ModelMetadataDetailsProviders.Add(new SystemTextJsonValidationMetadataProvider()));
    builder.Services.AddOpenApi();
    builder.Services.AddSparksHealthChecks();

    var app = builder.Build();

    if (app.Environment.IsDevelopment())
    {
        await app.MigrateDatabaseAsync();
    }

    // ── Pipeline ─────────────────────────────────────────────────────────────
    // The exception handler runs first so it catches errors from everything
    // after it; security headers come next so error responses carry them too.
    // Forwarded headers are applied before anything reads the client IP.
    app.UseExceptionHandler();
    app.UseStatusCodePages();
    app.UseMiddleware<SecurityHeadersMiddleware>();
    app.UseForwardedHeaders();
    if (app.Environment.IsRealEnvironment())
    {
        app.UseHsts();
    }

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi().AllowAnonymous();
    }

    app.UseSerilogRequestLogging();
    app.UseRateLimiter();
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();
    app.MapSparksHealthEndpoints();

    await app.RunAsync();
    return 0;
}
// EF Core's design-time tools stop the host on purpose once they have the
// services they need; that isn't a startup failure.
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "Sparks API failed to start");
    return 1;
}
finally
{
    await Log.CloseAndFlushAsync();
}
