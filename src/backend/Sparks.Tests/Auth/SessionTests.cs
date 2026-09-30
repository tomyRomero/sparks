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

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task The_current_user_requires_a_signed_in_request()
    {
        var response = await factory.CreateClient().GetAsync(MePath, Ct);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

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

        clock.Advance(TimeSpan.FromMinutes(31));
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
        firstAgain.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        // Moments after rotation, the old token failing is a harmless race
        // (two tabs), so the session carries on with the new token.
        (await client.RefreshWithAsync(second, Ct)).StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Concurrent_refreshes_with_one_token_have_exactly_one_winner()
    {
        var client = factory.CreateCookielessClient();
        var token = (await client.SignUpAsync(AuthHelpers.NewAccount(), Ct)).CookieValue(AuthCookies.RefreshToken);

        var responses = await Task.WhenAll(Enumerable.Range(0, 5).Select(_ => client.RefreshWithAsync(token, Ct)));

        responses.Count(response => response.StatusCode == HttpStatusCode.OK).Should().Be(1);
        var winner = responses.Single(response => response.StatusCode == HttpStatusCode.OK);
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

        clock.Advance(TimeSpan.FromMinutes(1));
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
    public async Task A_failed_refresh_clears_the_cookies()
    {
        var response = await factory.CreateCookielessClient().RefreshWithAsync("not-a-real-token", Ct);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        response.SetCookie(AuthCookies.RefreshToken)!.Expires.Should().BeBefore(DateTimeOffset.UtcNow);
    }

    private Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory<Program> WithClock(TimeProvider clock) =>
        factory.WithWebHostBuilder(builder =>
            builder.ConfigureTestServices(services => services.AddSingleton(clock)));
}
