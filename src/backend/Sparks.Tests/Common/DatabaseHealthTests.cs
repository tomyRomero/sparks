using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Sparks.Api.Common.Data;
using Sparks.Tests.Infrastructure;

namespace Sparks.Tests.Common;

public sealed class DatabaseHealthTests(SparksApiFactory factory)
{
    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Readiness_probe_reports_the_database_healthy()
    {
        var response = await factory.CreateClient().GetAsync("/health/ready", Ct);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>(Ct);
        body.GetProperty("status").GetString().Should().Be("Healthy");
        body.GetProperty("checks").EnumerateArray()
            .Should().ContainSingle(check => check.GetProperty("name").GetString() == "database");
    }

    [Fact]
    public async Task Readiness_probe_fails_without_revealing_the_database_address()
    {
        const string unreachableHost = "127.0.0.1,1";
        using var api = factory.WithWebHostBuilder(builder => builder.UseSetting(
            $"ConnectionStrings:{DatabaseServiceCollectionExtensions.ConnectionStringName}",
            $"Server={unreachableHost};Database=Sparks;Connect Timeout=2;TrustServerCertificate=True"));

        var response = await api.CreateClient().GetAsync("/health/ready", Ct);

        response.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
        var body = await response.Content.ReadAsStringAsync(Ct);
        body.Should().Contain("Unhealthy");
        body.Should().NotContain("127.0.0.1");
    }
}
