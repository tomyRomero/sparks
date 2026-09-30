using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Time.Testing;
using Microsoft.Net.Http.Headers;
using Sparks.Tests.Infrastructure;

namespace Sparks.Tests.Auth;

public sealed class LoginTests(SparksApiFactory factory)
{
    private static readonly string WrongPassword = AuthHelpers.Password + "-wrong";

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Accounts_sign_in_with_their_email_or_username()
    {
        var account = AuthHelpers.NewAccount();
        await factory.CreateClient().SignUpAsync(account, Ct);

        var byEmail = await factory.CreateClient().LogInAsync(account.Email, AuthHelpers.Password, Ct);
        var byUsername = await factory.CreateClient()
            .LogInAsync(account.Username.ToUpperInvariant(), AuthHelpers.Password, Ct);

        byEmail.StatusCode.Should().Be(HttpStatusCode.OK);
        byUsername.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task A_failure_looks_the_same_whether_or_not_the_account_exists()
    {
        var account = AuthHelpers.NewAccount();
        await factory.CreateClient().SignUpAsync(account, Ct);

        var wrongPassword = await factory.CreateClient().LogInAsync(account.Email, WrongPassword, Ct);
        var noSuchAccount = await factory.CreateClient()
            .LogInAsync($"{TestData.UniqueUsername()}@example.test", AuthHelpers.Password, Ct);

        foreach (var response in new[] { wrongPassword, noSuchAccount })
        {
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
            response.Headers.Contains(HeaderNames.SetCookie).Should().BeFalse();
        }

        var (first, second) = (await BodyAsync(wrongPassword), await BodyAsync(noSuchAccount));
        first.GetProperty("code").GetString().Should().Be("INVALID_CREDENTIALS");
        second.GetProperty("code").GetString().Should().Be("INVALID_CREDENTIALS");
        first.GetProperty("title").GetString().Should().Be(second.GetProperty("title").GetString());
    }

    [Fact]
    public async Task Repeated_failures_lock_the_account_even_against_the_right_password()
    {
        var account = AuthHelpers.NewAccount();
        await factory.CreateClient().SignUpAsync(account, Ct);
        var client = factory.CreateClient();

        var statuses = new List<HttpStatusCode>();
        for (var attempt = 0; attempt < 5; attempt++)
        {
            statuses.Add((await client.LogInAsync(account.Email, WrongPassword, Ct)).StatusCode);
        }

        var withRightPassword = await client.LogInAsync(account.Email, AuthHelpers.Password, Ct);

        statuses.Should().Equal(Enumerable.Repeat(HttpStatusCode.Unauthorized, 4).Append(HttpStatusCode.Locked));
        withRightPassword.StatusCode.Should().Be(HttpStatusCode.Locked);
        withRightPassword.Headers.RetryAfter.Should().NotBeNull();
        (await BodyAsync(withRightPassword)).GetProperty("code").GetString().Should().Be("ACCOUNT_LOCKED");
    }

    [Fact]
    public async Task Unknown_identifiers_lock_too_so_the_lock_reveals_nothing()
    {
        var ghost = TestData.UniqueUsername();
        var client = factory.CreateClient();

        HttpResponseMessage last = null!;
        for (var attempt = 0; attempt < 5; attempt++)
        {
            last = await client.LogInAsync(ghost, WrongPassword, Ct);
        }

        last.StatusCode.Should().Be(HttpStatusCode.Locked);
    }

    [Fact]
    public async Task The_lock_lifts_once_the_lockout_period_passes()
    {
        var clock = new FakeTimeProvider(DateTimeOffset.UtcNow);
        using var api = factory.WithWebHostBuilder(builder =>
            builder.ConfigureTestServices(services => services.AddSingleton<TimeProvider>(clock)));
        var account = AuthHelpers.NewAccount();
        await api.CreateClient().SignUpAsync(account, Ct);
        var client = api.CreateClient();
        for (var attempt = 0; attempt < 5; attempt++)
        {
            await client.LogInAsync(account.Email, WrongPassword, Ct);
        }

        clock.Advance(TimeSpan.FromMinutes(15) + TimeSpan.FromSeconds(1));
        var response = await client.LogInAsync(account.Email, AuthHelpers.Password, Ct);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task A_successful_sign_in_forgets_earlier_failures()
    {
        var account = AuthHelpers.NewAccount();
        await factory.CreateClient().SignUpAsync(account, Ct);
        var client = factory.CreateClient();

        for (var attempt = 0; attempt < 4; attempt++)
        {
            await client.LogInAsync(account.Email, WrongPassword, Ct);
        }

        await client.LogInAsync(account.Email, AuthHelpers.Password, Ct);
        for (var attempt = 0; attempt < 3; attempt++)
        {
            await client.LogInAsync(account.Email, WrongPassword, Ct);
        }

        var response = await client.LogInAsync(account.Email, WrongPassword, Ct);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    private static Task<JsonElement> BodyAsync(HttpResponseMessage response) =>
        response.Content.ReadFromJsonAsync<JsonElement>(Ct);
}
