using Serilog;
using Sparks.Api.Common;
using Sparks.Api.Common.Data;
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

    // ── API ──────────────────────────────────────────────────────────────────
    // Don't advertise the web server in every response.
    builder.WebHost.ConfigureKestrel(kestrel => kestrel.AddServerHeader = false);
    builder.Services.AddControllers();
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
    app.UseExceptionHandler();
    app.UseStatusCodePages();
    app.UseMiddleware<SecurityHeadersMiddleware>();
    if (app.Environment.IsRealEnvironment())
    {
        app.UseHsts();
    }

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
    }

    app.UseSerilogRequestLogging();
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
