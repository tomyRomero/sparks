using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Net.Http.Headers;
using Sparks.Api.Auth.Models;
using Sparks.Api.Auth.Services;
using Sparks.Tests.Infrastructure;

namespace Sparks.Tests.Auth;

public sealed class SignUpTests(SparksApiFactory factory)
{
    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Sign_up_creates_the_account_and_signs_it_in()
    {
        var client = factory.CreateClient();
        var account = AuthHelpers.NewAccount();

        var response = await client.SignUpAsync(account, Ct);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var user = await response.Content.ReadFromJsonAsync<CurrentUserResponse>(Ct);
        user!.Username.Should().Be(account.Username);
        user.Email.Should().Be(account.Email);

        foreach (var name in new[] { AuthCookies.AccessToken, AuthCookies.RefreshToken })
        {
            var cookie = response.SetCookie(name);
            cookie.Should().NotBeNull();
            cookie!.HttpOnly.Should().BeTrue();
            cookie.SameSite.Should().Be(SameSiteMode.Lax);
            cookie.Path.ToString().Should().Be("/");
        }

        var me = await client.GetFromJsonAsync<CurrentUserResponse>("/api/v1/auth/me", Ct);
        me!.Id.Should().Be(user.Id);
    }

    [Fact]
    public async Task Passwords_and_refresh_tokens_are_stored_only_as_hashes()
    {
        var account = AuthHelpers.NewAccount();
        var response = await factory.CreateClient().SignUpAsync(account, Ct);
        var refreshToken = response.CookieValue(AuthCookies.RefreshToken);

        await using var db = factory.CreateDbContext();
        var user = await db.Users.SingleAsync(row => row.Username == account.Username, Ct);
        var storedHashes = await db.RefreshTokens
            .Where(token => token.Session.UserId == user.Id)
            .Select(token => token.TokenHash)
            .ToListAsync(Ct);

        user.PasswordHash.Should().StartWith("$2").And.NotContain(AuthHelpers.Password);
        storedHashes.Should().Equal(TokenService.Hash(refreshToken));
    }

    [Fact]
    public async Task A_username_is_taken_regardless_of_case()
    {
        var first = AuthHelpers.NewAccount();
        await factory.CreateClient().SignUpAsync(first, Ct);
        var second = AuthHelpers.NewAccount() with { Username = first.Username.ToUpperInvariant() };

        var response = await factory.CreateClient().SignUpAsync(second, Ct);

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await response.ProblemCodeAsync(Ct)).Should().Be("USERNAME_TAKEN");
    }

    [Fact]
    public async Task An_email_has_at_most_one_account()
    {
        var first = AuthHelpers.NewAccount();
        await factory.CreateClient().SignUpAsync(first, Ct);
        var second = AuthHelpers.NewAccount() with { Email = first.Email.ToUpperInvariant() };

        var response = await factory.CreateClient().SignUpAsync(second, Ct);

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await response.ProblemCodeAsync(Ct)).Should().Be("EMAIL_TAKEN");
    }

    [Theory]
    [InlineData("username", "has spaces")]
    [InlineData("username", "ab")]
    [InlineData("username", "me@example.test")]
    [InlineData("email", "not-an-email")]
    [InlineData("password", "short")]
    // 37 characters, but 74 bytes in UTF-8: over BCrypt's 72-byte limit.
    [InlineData("password", "ééééééééééééééééééééééééééééééééééééé")]
    public async Task Invalid_sign_ups_name_the_field_at_fault(string field, string value)
    {
        var account = field switch
        {
            "username" => AuthHelpers.NewAccount() with { Username = value },
            "email" => AuthHelpers.NewAccount() with { Email = value },
            _ => AuthHelpers.NewAccount() with { Password = value },
        };

        var response = await factory.CreateClient().SignUpAsync(account, Ct);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>(Ct);
        problem.GetProperty("errors").EnumerateObject().Select(error => error.Name)
            .Should().Equal(field);
    }

    [Fact]
    public async Task A_sign_up_form_can_ask_whether_a_username_is_free()
    {
        var taken = AuthHelpers.NewAccount();
        await factory.CreateClient().SignUpAsync(taken, Ct);
        var free = TestData.UniqueUsername();
        var client = factory.CreateClient();

        var forFree = await client.GetFromJsonAsync<UsernameAvailabilityResponse>(
            $"/api/v1/auth/username-available?username={free}", Ct);
        var forTaken = await client.GetFromJsonAsync<UsernameAvailabilityResponse>(
            $"/api/v1/auth/username-available?username={taken.Username.ToUpperInvariant()}", Ct);

        forFree.Should().Be(new UsernameAvailabilityResponse(free, true));
        forTaken!.Available.Should().BeFalse("usernames compare without case");
    }

    [Theory]
    [InlineData("")]
    [InlineData("no spaces")]
    [InlineData("ab")]
    public async Task Asking_about_a_malformed_username_names_the_problem(string username)
    {
        var response = await factory.CreateClient().GetAsync(
            $"/api/v1/auth/username-available?username={Uri.EscapeDataString(username)}", Ct);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>(Ct);
        problem.GetProperty("errors").EnumerateObject().Select(error => error.Name)
            .Should().Equal("username");
    }

    [Fact]
    public async Task Sign_ups_are_rate_limited_per_client()
    {
        using var api = factory.WithWebHostBuilder(builder =>
            builder.UseSetting("RateLimits:SignupPerMinute", "2"));
        var client = api.CreateClient();

        var statuses = new List<HttpStatusCode>();
        for (var attempt = 0; attempt < 3; attempt++)
        {
            statuses.Add((await client.SignUpAsync(AuthHelpers.NewAccount(), Ct)).StatusCode);
        }

        statuses.Should().Equal(HttpStatusCode.Created, HttpStatusCode.Created, HttpStatusCode.TooManyRequests);
    }
}
