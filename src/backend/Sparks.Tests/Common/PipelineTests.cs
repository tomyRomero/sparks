using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Serilog.Core;
using Serilog.Events;
using Sparks.Tests.Infrastructure;

namespace Sparks.Tests.Common;

/// <summary>
/// Behaviour every endpoint gets from the shared pipeline: health probes,
/// security headers, and the shape of error responses.
/// </summary>
public sealed class PipelineTests(SparksApiFactory factory)
{
    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Liveness_probe_reports_healthy()
    {
        var response = await factory.CreateClient().GetAsync("/health/live", Ct);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>(Ct);
        body.GetProperty("status").GetString().Should().Be("Healthy");
    }

    [Fact]
    public async Task Responses_carry_the_security_headers()
    {
        var response = await factory.CreateClient().GetAsync("/health/live", Ct);

        response.Headers.GetValues("X-Content-Type-Options").Should().ContainSingle("nosniff");
        response.Headers.GetValues("X-Frame-Options").Should().ContainSingle("DENY");
        response.Headers.GetValues("Referrer-Policy").Should().ContainSingle("no-referrer");
        response.Headers.GetValues("Content-Security-Policy").Should().ContainSingle()
            .Which.Should().Contain("default-src 'none'");
    }

    [Fact]
    public void Kestrel_does_not_advertise_itself()
    {
        var kestrel = factory.Services.GetRequiredService<IOptions<KestrelServerOptions>>().Value;

        kestrel.AddServerHeader.Should().BeFalse();
    }

    [Fact]
    public async Task Requests_are_logged_through_the_hosts_configured_logger()
    {
        var logs = new CapturingLogSink();
        using var api = factory.WithWebHostBuilder(builder =>
            builder.ConfigureServices(services => services.AddSingleton<ILogEventSink>(logs)));

        await api.CreateClient().GetAsync("/health/live", Ct);

        logs.Events.Should().ContainSingle(log => IsRequestLog(log, "/health/live"));
    }

    private static bool IsRequestLog(LogEvent log, string path) =>
        log.MessageTemplate.Text.Contains("responded")
        && log.Properties.GetValueOrDefault("RequestPath") is ScalarValue { Value: string logged }
        && logged == path;

    [Fact]
    public async Task Anonymous_requests_to_unknown_routes_get_a_401_problem()
    {
        // Sign-in is required by default, so an anonymous caller can't tell
        // which routes exist.
        var response = await factory.CreateClient().GetAsync("/no-such-route", Ct);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
        response.Headers.Should().Contain(header => header.Key == "X-Content-Type-Options");
    }

    [Fact]
    public async Task Unhandled_exceptions_return_a_generic_500_without_internals()
    {
        using var throwingApi = factory.WithWebHostBuilder(builder =>
            builder.ConfigureServices(services =>
                services.AddControllers().AddApplicationPart(typeof(ThrowingController).Assembly)));

        var response = await throwingApi.CreateClient().GetAsync(ThrowingController.Path, Ct);

        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
        var body = await response.Content.ReadAsStringAsync(Ct);
        body.Should().NotContain(ThrowingController.SecretMessage);
        body.Should().NotContain(nameof(ThrowingController));
        JsonDocument.Parse(body).RootElement.GetProperty("traceId").GetString().Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task A_request_the_client_abandons_ends_as_a_499_without_logging_an_error()
    {
        var probe = new RequestProbe();
        var logs = new CapturingLogSink();
        using var throwingApi = factory.WithWebHostBuilder(builder =>
            builder.ConfigureServices(services =>
            {
                services.AddControllers().AddApplicationPart(typeof(ThrowingController).Assembly);
                services.AddSingleton(probe);
                services.AddSingleton<IStartupFilter>(probe);
                services.AddSingleton<ILogEventSink>(logs);
            }));
        using var leave = CancellationTokenSource.CreateLinkedTokenSource(Ct);

        var request = throwingApi.CreateClient().GetAsync(ThrowingController.AfterAbortPath, leave.Token);
        await probe.Started.Task.WaitAsync(Ct);
        await leave.CancelAsync();
        var status = await probe.Finished.Task.WaitAsync(TimeSpan.FromSeconds(30), Ct);

        await FluentActions.Awaiting(() => request).Should().ThrowAsync<OperationCanceledException>();
        status.Should().Be(StatusCodes.Status499ClientClosedRequest);
        logs.Events.Should().Contain(
            log => IsRequestLog(log, "/" + ThrowingController.AfterAbortPath), "the request itself is still logged");
        logs.Events.Should().NotContain(log => log.Level >= LogEventLevel.Error);
    }

    [Fact]
    public async Task OpenApi_document_is_not_served_outside_development()
    {
        var response = await factory.CreateClient().GetAsync("/openapi/v1.json", Ct);

        response.StatusCode.Should().NotBe(HttpStatusCode.OK);
    }
}
