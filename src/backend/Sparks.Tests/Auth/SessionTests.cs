using System.Net;
using System.Net.Http.Headers;
using FluentAssertions;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Time.Testing;
using Sparks.Api.Auth.Services;
using Sparks.Tests.Infrastructure;

namespace Sparks.Tests.Auth;

/// <summary>Access tokens, refresh-token rotation and reuse detection, and sign-out.</summary>
public sealed class SessionTests(SparksApiFactory factory)
{
    private const string MePath = "/api/v1/auth/me";

    /// <summary>The token lifetimes the API runs with.</summary>
    private static readonly JwtOptions Jwt = new();

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task The_access_token_also_works_as_a_bearer_token()
    {
        var signedUp = await factory.CreateClient().SignUpAsync(AuthHelpers.NewAccount(), Ct);
        var client = factory.CreateCookielessClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", signedUp.CookieValue(AuthCookies.AccessToken));

        var response = await client.GetAsync(MePath, Ct);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task A_tampered_access_token_is_rejected()
    {
        var signedUp = await factory.CreateClient().SignUpAsync(AuthHelpers.NewAccount(), Ct);
        var token = signedUp.CookieValue(AuthCookies.AccessToken);
        var tampered = token[..^2] + (token[^2] == 'A' ? "B" : "A") + token[^1];
        var client = factory.CreateCookielessClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tampered);

        var response = await client.GetAsync(MePath, Ct);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task An_expired_access_token_is_rejected_until_the_session_refreshes()
    {
        var clock = new FakeTimeProvider(DateTimeOffset.UtcNow);
        using var api = WithClock(clock);
        var client = api.CreateClient();
        await client.SignUpAsync(AuthHelpers.NewAccount(), Ct);

        clock.Advance(Jwt.AccessTokenLifetime + TimeSpan.FromSeconds(1));
        var expired = await client.GetAsync(MePath, Ct);
        var refresh = await client.PostAsync("/api/v1/auth/refresh", content: null, Ct);
        var afterRefresh = await client.GetAsync(MePath, Ct);

        expired.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        refresh.StatusCode.Should().Be(HttpStatusCode.OK);
        afterRefresh.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Refreshing_replaces_the_refresh_token()
    {
        var client = factory.CreateCookielessClient();
        var first = (await client.SignUpAsync(AuthHelpers.NewAccount(), Ct)).CookieValue(AuthCookies.RefreshToken);

        var refreshed = await client.RefreshWithAsync(first, Ct);
        var second = refreshed.CookieValue(AuthCookies.RefreshToken);
        var firstAgain = await client.RefreshWithAsync(first, Ct);

        refreshed.StatusCode.Should().Be(HttpStatusCode.OK);
        second.Should().NotBe(first);
        // Moments after rotation the old token is a race (two tabs): it gets an
        // access token but leaves the newer refresh cookie alone.
        firstAgain.StatusCode.Should().Be(HttpStatusCode.OK);
        firstAgain.SetCookie(AuthCookies.AccessToken).Should().NotBeNull();
        firstAgain.SetCookie(AuthCookies.RefreshToken).Should().BeNull();
        (await client.RefreshWithAsync(second, Ct)).StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Concurrent_refreshes_with_one_token_rotate_it_once_and_all_stay_signed_in()
    {
        var client = factory.CreateCookielessClient();
        var token = (await client.SignUpAsync(AuthHelpers.NewAccount(), Ct)).CookieValue(AuthCookies.RefreshToken);

        var responses = await Task.WhenAll(Enumerable.Range(0, 5).Select(_ => client.RefreshWithAsync(token, Ct)));

        responses.Should().OnlyContain(response => response.StatusCode == HttpStatusCode.OK);
        responses.Should().OnlyContain(response => response.SetCookie(AuthCookies.AccessToken) != null);
        var winner = responses.Single(response => response.SetCookie(AuthCookies.RefreshToken) != null);
        var next = await client.RefreshWithAsync(winner.CookieValue(AuthCookies.RefreshToken), Ct);
        next.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Replaying_a_long_rotated_refresh_token_ends_every_session_of_the_user()
    {
        var clock = new FakeTimeProvider(DateTimeOffset.UtcNow);
        using var api = WithClock(clock);
        var client = api.CreateCookielessClient();
        var account = AuthHelpers.NewAccount();
        var stolen = (await client.SignUpAsync(account, Ct)).CookieValue(AuthCookies.RefreshToken);
        var otherDevice = (await client.LogInAsync(account.Email, AuthHelpers.Password, Ct))
            .CookieValue(AuthCookies.RefreshToken);
        var rotated = (await client.RefreshWithAsync(stolen, Ct)).CookieValue(AuthCookies.RefreshToken);

        clock.Advance(Jwt.RotationGracePeriod + TimeSpan.FromSeconds(1));
        var replay = await client.RefreshWithAsync(stolen, Ct);

        replay.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await client.RefreshWithAsync(rotated, Ct)).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await client.RefreshWithAsync(otherDevice, Ct)).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Signing_out_ends_the_session_and_clears_the_cookies()
    {
        var client = factory.CreateCookielessClient();
        var token = (await client.SignUpAsync(AuthHelpers.NewAccount(), Ct)).CookieValue(AuthCookies.RefreshToken);
        var logout = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/logout");
        logout.Headers.Add("Cookie", $"{AuthCookies.RefreshToken}={token}");

        var response = await client.SendAsync(logout, Ct);

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        foreach (var name in new[] { AuthCookies.AccessToken, AuthCookies.RefreshToken })
        {
            response.SetCookie(name)!.Expires.Should().BeBefore(DateTimeOffset.UtcNow);
        }

        (await client.RefreshWithAsync(token, Ct)).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task An_access_token_stops_working_as_soon_as_its_session_signs_out()
    {
        var client = factory.CreateCookielessClient();
        var signUp = await client.SignUpAsync(AuthHelpers.NewAccount(), Ct);
        var (access, refresh) = (signUp.CookieValue(AuthCookies.AccessToken), signUp.CookieValue(AuthCookies.RefreshToken));
        var logout = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/logout");
        logout.Headers.Add("Cookie", $"{AuthCookies.RefreshToken}={refresh}");

        (await MeWithAsync(client, access)).StatusCode.Should().Be(HttpStatusCode.OK);
        await client.SendAsync(logout, Ct);

        (await MeWithAsync(client, access)).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task A_failed_refresh_clears_the_cookies()
    {
        var response = await factory.CreateCookielessClient().RefreshWithAsync("not-a-real-token", Ct);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        response.SetCookie(AuthCookies.RefreshToken)!.Expires.Should().BeBefore(DateTimeOffset.UtcNow);
    }

    private static Task<HttpResponseMessage> MeWithAsync(HttpClient client, string accessToken)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, MePath);
        request.Headers.Authorization = new("Bearer", accessToken);
        return client.SendAsync(request, Ct);
    }

    private Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory<Program> WithClock(TimeProvider clock) =>
        factory.WithWebHostBuilder(builder =>
            builder.ConfigureTestServices(services => services.AddSingleton(clock)));
}
