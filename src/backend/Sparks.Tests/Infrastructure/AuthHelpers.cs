using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Net.Http.Headers;
using Sparks.Api.Auth.Models;
using Sparks.Api.Auth.Services;

namespace Sparks.Tests.Infrastructure;

/// <summary>Signs test accounts up and in through the real endpoints.</summary>
internal static class AuthHelpers
{
    /// <summary>
    /// Every test account's password, generated once per run so no password
    /// is ever committed; accounts differ only in name.
    /// </summary>
    public static readonly string Password = $"pw-{Guid.NewGuid():N}";

    public static SignupRequest NewAccount()
    {
        var username = TestData.UniqueUsername();
        return new SignupRequest
        {
            Email = $"{username}@example.test",
            Username = username,
            DisplayName = "Test Person",
            Password = Password,
        };
    }

    public static Task<HttpResponseMessage> SignUpAsync(
        this HttpClient client, SignupRequest account, CancellationToken ct) =>
        client.PostAsJsonAsync("/api/v1/auth/signup", account, ct);

    public static Task<HttpResponseMessage> LogInAsync(
        this HttpClient client, string identifier, string password, CancellationToken ct) =>
        client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest { Identifier = identifier, Password = password }, ct);

    /// <summary>A client that keeps no cookies, for requests that must carry exactly the cookies a test chooses.</summary>
    public static HttpClient CreateCookielessClient(this WebApplicationFactory<Program> factory) =>
        factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

    /// <summary>POSTs to the refresh endpoint with the given refresh token as its only cookie.</summary>
    public static Task<HttpResponseMessage> RefreshWithAsync(this HttpClient client, string refreshToken, CancellationToken ct)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh");
        request.Headers.Add(HeaderNames.Cookie, $"{AuthCookies.RefreshToken}={refreshToken}");
        return client.SendAsync(request, ct);
    }

    /// <summary>The cookie a response sets under <paramref name="name"/>, or null.</summary>
    public static SetCookieHeaderValue? SetCookie(this HttpResponseMessage response, string name) =>
        response.Headers.TryGetValues(HeaderNames.SetCookie, out var headers)
            ? SetCookieHeaderValue.ParseList(headers.ToList()).SingleOrDefault(cookie => cookie.Name == name)
            : null;

    /// <summary>The value of a cookie the response sets; fails the test when it's missing.</summary>
    public static string CookieValue(this HttpResponseMessage response, string name) =>
        response.SetCookie(name)?.Value.ToString()
            ?? throw new InvalidOperationException($"The response set no {name} cookie.");
}
