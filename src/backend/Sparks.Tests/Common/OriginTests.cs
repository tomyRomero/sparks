using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.Net.Http.Headers;
using Sparks.Api.Auth.Models;
using Sparks.Api.Realtime;
using Sparks.Tests.Infrastructure;

namespace Sparks.Tests.Common;

/// <summary>Only the web app, from a browser, may change things or open the live connection.</summary>
public sealed class OriginTests(SparksApiFactory factory)
{
    /// <summary>The web app's origin, from <c>Frontend:BaseUrl</c> in appsettings.json.</summary>
    private const string WebApp = "http://localhost:3100";
    private const string OtherSite = "https://attacker.example";

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task A_write_sent_from_another_site_is_refused()
    {
        var response = await LogInFromAsync(OtherSite);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await response.ProblemCodeAsync(Ct)).Should().Be("FOREIGN_ORIGIN");
    }

    [Theory]
    [InlineData(WebApp)]
    [InlineData(null)]
    public async Task Writes_from_the_web_app_or_outside_a_browser_reach_the_api(string? origin)
    {
        var response = await LogInFromAsync(origin);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized, "the request got as far as checking the password");
    }

    [Fact]
    public async Task Reads_are_not_checked()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/posts");
        request.Headers.Add(HeaderNames.Origin, OtherSite);

        var response = await factory.CreateClient().SendAsync(request, Ct);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Headers.Contains(HeaderNames.AccessControlAllowOrigin).Should().BeFalse("other sites can't read it from a browser");
    }

    [Fact]
    public async Task The_web_app_may_call_the_api_with_credentials()
    {
        var response = await PreflightFromAsync(WebApp);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        response.Headers.GetValues(HeaderNames.AccessControlAllowOrigin).Should().Equal(WebApp);
        response.Headers.GetValues(HeaderNames.AccessControlAllowCredentials).Should().Equal("true");
    }

    [Fact]
    public async Task Other_sites_get_no_cross_origin_access()
    {
        var response = await PreflightFromAsync(OtherSite);

        response.Headers.Contains(HeaderNames.AccessControlAllowOrigin).Should().BeFalse();
    }

    [Fact]
    public async Task The_live_connection_refuses_other_sites()
    {
        var client = factory.Server.CreateWebSocketClient();
        client.ConfigureRequest = request => request.Headers.Origin = OtherSite;

        var connect = () => client.ConnectAsync(new Uri(factory.Server.BaseAddress, RealtimeHub.Path), Ct);

        (await connect.Should().ThrowAsync<InvalidOperationException>()).WithMessage("*403*");
    }

    private async Task<HttpResponseMessage> LogInFromAsync(string? origin)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/login")
        {
            Content = JsonContent.Create(
                new LoginRequest { Identifier = TestData.UniqueUsername(), Password = AuthHelpers.Password },
                options: ApiJson.Options),
        };
        if (origin is not null)
        {
            request.Headers.Add(HeaderNames.Origin, origin);
        }

        return await factory.CreateClient().SendAsync(request, Ct);
    }

    private async Task<HttpResponseMessage> PreflightFromAsync(string origin)
    {
        using var request = new HttpRequestMessage(HttpMethod.Options, "/api/v1/posts");
        request.Headers.Add(HeaderNames.Origin, origin);
        request.Headers.Add(HeaderNames.AccessControlRequestMethod, "POST");
        request.Headers.Add(HeaderNames.AccessControlRequestHeaders, "content-type");
        return await factory.CreateClient().SendAsync(request, Ct);
    }
}
