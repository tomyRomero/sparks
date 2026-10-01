using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Diagnostics;
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
using Sparks.Api.Presence;
using Sparks.Api.Realtime;
using Sparks.Api.Seeding;
using Sparks.Api.Storage;
using Sparks.Api.Users.Services;

// Catches failures before the host's logger exists.
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // preserveStaticLogger: otherwise Serilog freezes the static logger and
    // parallel test hosts fail to start.
    builder.Host.UseSerilog(
        (context, services, logger) => logger
            .ReadFrom.Configuration(context.Configuration)
            .ReadFrom.Services(services)
            .Enrich.FromLogContext()
            .WriteTo.Console(),
        preserveStaticLogger: true);

    // RFC 9457 problem details for every error, unhandled exceptions included.
    builder.Services.AddProblemDetails();
    builder.Services.AddExceptionHandler<AbortedRequestHandler>();
    builder.Services.AddExceptionHandler<ApiExceptionHandler>();

    builder.Services.AddSparksDatabase();
    builder.Services.AddSparksStorage(builder.Configuration);

    builder.Services.AddOptions<FrontendOptions>()
        .BindConfiguration(FrontendOptions.SectionName)
        .ValidateDataAnnotations()
        .ValidateOnStart();
    builder.Services.AddSingleton<IEmailSender, LoggingEmailSender>();

    // Injected so tests can move time forward.
    builder.Services.AddSingleton(TimeProvider.System);
    builder.Services.AddSparksAuth();
    builder.Services.AddSparksRateLimiting(builder.Environment);
    // Only the web app's origin may call with credentials.
    builder.Services.AddCors();
    builder.Services.AddOptions<CorsOptions>()
        .Configure<IOptions<FrontendOptions>>((cors, frontend) => cors.AddDefaultPolicy(policy => policy
            .WithOrigins(frontend.Value.Origin)
            .AllowCredentials()
            .AllowAnyHeader()
            .AllowAnyMethod()));

    builder.WebHost.ConfigureKestrel(kestrel => kestrel.AddServerHeader = false);
    // Validation errors use the JSON field name ("email"), not "Email".
    builder.Services.AddControllers(mvc =>
            mvc.ModelMetadataDetailsProviders.Add(new SystemTextJsonValidationMetadataProvider()))
        .AddJsonOptions(json =>
            // Enums as names only; a number could be an undefined value.
            json.JsonSerializerOptions.Converters.Add(
                new JsonStringEnumConverter(JsonNamingPolicy.CamelCase, allowIntegerValues: false)));
    builder.Services.AddOpenApi();

    builder.Services.AddScoped<PostService>();
    builder.Services.AddScoped<CommentService>();
    builder.Services.AddScoped<UserService>();
    builder.Services.AddScoped<ActivityService>();
    builder.Services.AddScoped<ActivityNotifier>();
    builder.Services.AddScoped<ChatService>();
    builder.Services.AddSparksHealthChecks();

    builder.Services.AddSparksAi(builder.Configuration);

    builder.Services.AddSignalR();
    builder.Services.AddSingleton<IUserIdProvider, UserIdProvider>();
    builder.Services.AddSparksPresence();

    var app = builder.Build();

    if (app.Environment.IsDevelopment())
    {
        await app.MigrateDatabaseAsync();
    }

    // dotnet run -- seed
    if (args is ["seed"])
    {
        return await app.SeedDemoDataAsync();
    }

    // Order matters: forwarded headers first for the real client IP, request
    // logging outside the exception handler so it logs the final status, and
    // security headers after it so error responses get them too.
    app.UseForwardedHeaders();
    // The host's logger, not the bootstrap one (see preserveStaticLogger).
    app.UseSerilogRequestLogging(options => options.Logger = app.Services.GetRequiredService<Serilog.ILogger>());
    app.UseExceptionHandler(new ExceptionHandlerOptions
    {
        // Handled exceptions (ApiException, aborted requests) aren't errors.
        SuppressDiagnosticsCallback = context =>
            context.ExceptionHandledBy == ExceptionHandledType.ExceptionHandlerService,
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

    // CORS answers preflights; the origin check blocks writes and hub
    // connections from other sites.
    app.UseCors();
    app.UseMiddleware<OriginCheckMiddleware>();
    // Before the limiter, so uploads and AI are limited per member.
    app.UseAuthentication();
    app.UseRateLimiter();
    app.UseAuthorization();
    app.MapControllers();
    // Clients reconnect with a fresh token when theirs expires.
    app.MapHub<RealtimeHub>(RealtimeHub.Path, hub => hub.CloseOnAuthenticationExpiration = true);
    app.MapSparksHealthEndpoints();

    await app.RunAsync();
    return 0;
}
// EF Core's design-time tools abort the host on purpose.
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "Sparks API failed to start");
    return 1;
}
finally
{
    await Log.CloseAndFlushAsync();
}
