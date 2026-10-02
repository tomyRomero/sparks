using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Time.Testing;
using Sparks.Api.Auth.Models;
using Sparks.Api.Auth.Services;
using Sparks.Api.Common.Email;
using Sparks.Tests.Infrastructure;

namespace Sparks.Tests.Auth;

public sealed class PasswordResetTests(SparksApiFactory factory)
{
    private static readonly string NewPassword = AuthHelpers.Password + "-new";

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task A_known_address_is_emailed_a_link_to_the_web_app()
    {
        var (api, outbox) = ApiWithOutbox();
        using var _ = api;
        var account = AuthHelpers.NewAccount();
        await api.CreateClient().SignUpAsync(account, Ct);

        var response = await RequestResetAsync(api, account.Email);

        response.StatusCode.Should().Be(HttpStatusCode.Accepted);
        var email = outbox.Sent.Should().ContainSingle().Subject;
        email.To.Should().Be(account.Email);
        email.Body.Should().Contain("http://localhost:3100/reset-password?token=");
    }

    [Fact]
    public async Task An_unknown_address_gets_the_same_answer_and_no_email()
    {
        var (api, outbox) = ApiWithOutbox();
        using var _ = api;

        var response = await RequestResetAsync(api, $"{TestData.UniqueUsername()}@example.test");

        response.StatusCode.Should().Be(HttpStatusCode.Accepted);
        outbox.Sent.Should().BeEmpty();
    }

    [Fact]
    public async Task A_reset_sets_the_new_password_and_ends_every_session()
    {
        var (api, outbox) = ApiWithOutbox();
        using var _ = api;
        var account = AuthHelpers.NewAccount();
        var client = api.CreateCookielessClient();
        var session = (await client.SignUpAsync(account, Ct)).CookieValue(AuthCookies.RefreshToken);
        await RequestResetAsync(api, account.Email);

        var reset = await ResetAsync(api, outbox.ResetTokenFor(account.Email), NewPassword);

        reset.StatusCode.Should().Be(HttpStatusCode.NoContent);
        (await client.RefreshWithAsync(session, Ct)).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await client.LogInAsync(account.Email, AuthHelpers.Password, Ct)).StatusCode
            .Should().Be(HttpStatusCode.Unauthorized);
        (await client.LogInAsync(account.Email, NewPassword, Ct)).StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task A_link_works_only_once()
    {
        var (api, outbox) = ApiWithOutbox();
        using var _ = api;
        var account = AuthHelpers.NewAccount();
        await api.CreateClient().SignUpAsync(account, Ct);
        await RequestResetAsync(api, account.Email);
        var token = outbox.ResetTokenFor(account.Email);

        await ResetAsync(api, token, NewPassword);
        var second = await ResetAsync(api, token, NewPassword + "-again");

        second.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await second.Content.ReadFromJsonAsync<JsonElement>(Ct)).GetProperty("code").GetString()
            .Should().Be("INVALID_RESET_LINK");
    }

    [Fact]
    public async Task A_newer_request_replaces_earlier_links()
    {
        var (api, outbox) = ApiWithOutbox();
        using var _ = api;
        var account = AuthHelpers.NewAccount();
        await api.CreateClient().SignUpAsync(account, Ct);
        await RequestResetAsync(api, account.Email);
        var first = outbox.ResetTokenFor(account.Email);
        await RequestResetAsync(api, account.Email);
        var second = outbox.ResetTokenFor(account.Email);

        (await ResetAsync(api, first, NewPassword)).StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ResetAsync(api, second, NewPassword)).StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task A_link_expires_after_an_hour()
    {
        var clock = new FakeTimeProvider(DateTimeOffset.UtcNow);
        var (api, outbox) = ApiWithOutbox(clock);
        using var _ = api;
        var account = AuthHelpers.NewAccount();
        await api.CreateClient().SignUpAsync(account, Ct);
        await RequestResetAsync(api, account.Email);

        clock.Advance(TimeSpan.FromMinutes(61));
        var response = await ResetAsync(api, outbox.ResetTokenFor(account.Email), NewPassword);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task A_reset_unlocks_a_locked_account()
    {
        var (api, outbox) = ApiWithOutbox();
        using var _ = api;
        var account = AuthHelpers.NewAccount();
        var client = api.CreateClient();
        await client.SignUpAsync(account, Ct);
        for (var attempt = 0; attempt < new AccountLockoutOptions().AttemptThreshold; attempt++)
        {
            await client.LogInAsync(account.Email, "wrong-" + AuthHelpers.Password, Ct);
        }

        await RequestResetAsync(api, account.Email);
        await ResetAsync(api, outbox.ResetTokenFor(account.Email), NewPassword);

        (await client.LogInAsync(account.Email, NewPassword, Ct)).StatusCode.Should().Be(HttpStatusCode.OK);
    }

    /// <summary>A host whose emails land in an in-memory outbox (and, optionally, whose clock the test controls).</summary>
    private (WebApplicationFactory<Program> Api, CapturingEmailSender Outbox) ApiWithOutbox(TimeProvider? clock = null)
    {
        var outbox = new CapturingEmailSender();
        var api = factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.AddSingleton<IEmailSender>(outbox);
            if (clock is not null)
            {
                services.AddSingleton(clock);
            }
        }));
        return (api, outbox);
    }

    private static Task<HttpResponseMessage> RequestResetAsync(WebApplicationFactory<Program> api, string email) =>
        api.CreateClient().PostAsJsonAsync(
            "/api/v1/auth/forgot-password", new ForgotPasswordRequest { Email = email }, Ct);

    private static Task<HttpResponseMessage> ResetAsync(
        WebApplicationFactory<Program> api, string token, string password) =>
        api.CreateClient().PostAsJsonAsync(
            "/api/v1/auth/reset-password", new ResetPasswordRequest { Token = token, Password = password }, Ct);
}
