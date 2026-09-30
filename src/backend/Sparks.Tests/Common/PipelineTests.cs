using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
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
    public async Task Unknown_routes_return_problem_details()
    {
        var response = await factory.CreateClient().GetAsync("/no-such-route", Ct);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
        response.Headers.Should().Contain(header => header.Key == "X-Content-Type-Options");
    }

    [Fact]
    public async Task Unhandled_exceptions_return_a_generic_500_without_internals()
    {
        using var throwingApi = factory.WithWebHostBuilder(builder =>
            builder.ConfigureServices(services =>
                services.AddTransient<IStartupFilter, ThrowingEndpoint>()));

        var response = await throwingApi.CreateClient().GetAsync(ThrowingEndpoint.Path, Ct);

        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
        var body = await response.Content.ReadAsStringAsync(Ct);
        body.Should().NotContain(ThrowingEndpoint.SecretMessage);
        body.Should().NotContain(nameof(ThrowingEndpoint));
        JsonDocument.Parse(body).RootElement.GetProperty("traceId").GetString().Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task OpenApi_document_is_not_served_outside_development()
    {
        var response = await factory.CreateClient().GetAsync("/openapi/v1.json", Ct);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    /// <summary>
    /// Adds a route after the API's own pipeline that always throws, so the test
    /// exercises the real exception handler rather than a stand-in.
    /// </summary>
    private sealed class ThrowingEndpoint : IStartupFilter
    {
        public const string Path = "/test/throw";
        public const string SecretMessage = "connection string: Server=internal-db;Password=hunter2";

        public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next) => app =>
        {
            next(app);
            app.Map(Path, branch => branch.Run(_ => throw new InvalidOperationException(SecretMessage)));
        };
    }
}
