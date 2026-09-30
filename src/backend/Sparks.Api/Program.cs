using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Metadata;
using Serilog;
using Sparks.Api.Auth;
using Sparks.Api.Common;
using Sparks.Api.Common.Data;
using Sparks.Api.Common.Email;
using Sparks.Api.Common.Errors;
using Sparks.Api.Common.Health;
using Sparks.Api.Common.Security;
using Sparks.Api.Posts.Services;

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
    builder.Services.AddExceptionHandler<ApiExceptionHandler>();

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
            mvc.ModelMetadataDetailsProviders.Add(new SystemTextJsonValidationMetadataProvider()))
        .AddJsonOptions(json =>
            // Enums travel as names ("movieScript"), never numbers, so a stray
            // number can't reach the database as an undefined value.
            json.JsonSerializerOptions.Converters.Add(
                new JsonStringEnumConverter(JsonNamingPolicy.CamelCase, allowIntegerValues: false)));
    builder.Services.AddOpenApi();

    // ── Features ─────────────────────────────────────────────────────────────
    builder.Services.AddScoped<PostService>();
    builder.Services.AddScoped<CommentService>();
    builder.Services.AddSparksHealthChecks();

    var app = builder.Build();

    if (app.Environment.IsDevelopment())
    {
        await app.MigrateDatabaseAsync();
    }

    // ── Pipeline ─────────────────────────────────────────────────────────────
    // Forwarded headers come first, so everything after sees the real client
    // IP. Request logging wraps the exception handler, so it records the
    // status the client actually got rather than the exception on its way
    // out. The exception handler catches errors from everything after it, and
    // security headers come next so error responses carry them too.
    app.UseForwardedHeaders();
    app.UseSerilogRequestLogging();
    app.UseExceptionHandler(new ExceptionHandlerOptions
    {
        // An ApiException is an expected outcome (404, 403), answered by
        // ApiExceptionHandler; only unexpected exceptions are logged as errors.
        SuppressDiagnosticsCallback = context => context.Exception is ApiException,
    });
    app.UseStatusCodePages();
    app.UseMiddleware<SecurityHeadersMiddleware>();
    if (app.Environment.IsRealEnvironment())
    {
        app.UseHsts();
    }

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi().AllowAnonymous();
    }

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
