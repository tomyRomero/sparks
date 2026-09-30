using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Mvc.ModelBinding.Metadata;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using Serilog;
using Sparks.Api.Activity.Services;
using Sparks.Api.Ai;
using Sparks.Api.Auth;
using Sparks.Api.Chat.Services;
using Sparks.Api.Common;
using Sparks.Api.Common.Data;
using Sparks.Api.Common.Email;
using Sparks.Api.Common.Errors;
using Sparks.Api.Common.Health;
using Sparks.Api.Common.Security;
using Sparks.Api.Posts.Services;
using Sparks.Api.Realtime;
using Sparks.Api.Seeding;
using Sparks.Api.Storage;
using Sparks.Api.Users.Services;

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

    // ── Storage ──────────────────────────────────────────────────────────────
    builder.Services.AddSparksStorage();

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
    // The web app calls the API from the browser with its cookies; its
    // origin, and only it, gets cross-origin access with credentials.
    builder.Services.AddCors();
    builder.Services.AddOptions<CorsOptions>()
        .Configure<IOptions<FrontendOptions>>((cors, frontend) => cors.AddDefaultPolicy(policy => policy
            .WithOrigins(frontend.Value.Origin)
            .AllowCredentials()
            .AllowAnyHeader()
            .AllowAnyMethod()));

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
    builder.Services.AddScoped<UserService>();
    builder.Services.AddScoped<ActivityService>();
    builder.Services.AddScoped<ChatService>();
    builder.Services.AddSparksHealthChecks();

    // ── AI ───────────────────────────────────────────────────────────────────
    builder.Services.AddSparksAi(builder.Configuration);

    // ── Realtime ─────────────────────────────────────────────────────────────
    builder.Services.AddSignalR();
    builder.Services.AddSingleton<IUserIdProvider, UserIdProvider>();

    var app = builder.Build();

    if (app.Environment.IsDevelopment())
    {
        await app.MigrateDatabaseAsync();
    }

    // `dotnet run -- seed` fills a development database with demo data and exits.
    if (args is ["seed"])
    {
        return await app.SeedDemoDataAsync();
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

    // CORS answers the web app's preflight requests; the origin check then
    // turns away writes and live connections from any other site.
    app.UseCors();
    app.UseMiddleware<OriginCheckMiddleware>();
    // Authentication runs before the limiter so uploads and AI can be
    // limited per member rather than per address.
    app.UseAuthentication();
    app.UseRateLimiter();
    app.UseAuthorization();
    app.MapControllers();
    // A connection outlives the access token it opened with; closing it when
    // the token expires makes the browser reconnect with a refreshed one.
    app.MapHub<RealtimeHub>(RealtimeHub.Path, hub => hub.CloseOnAuthenticationExpiration = true);
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
