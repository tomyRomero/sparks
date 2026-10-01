using System.Net;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Sparks.Api.Presence.Models;
using Sparks.Api.Presence.Services;
using Sparks.Api.Realtime;
using Sparks.Tests.Infrastructure;

namespace Sparks.Tests.Presence;

/// <summary>Who's online: arriving and leaving over the live connection, and asking the API.</summary>
public sealed class PresenceTests(SparksApiFactory factory)
{
    private const string PresencePath = "/api/v1/presence";

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Connecting_puts_a_member_online_for_everyone_signed_in()
    {
        var (watcher, _, watcherToken) = await factory.SignedInWithTokenAsync(Ct);
        var (_, alice, aliceToken) = await factory.SignedInWithTokenAsync(Ct);
        await using var watcherLive = await factory.ConnectLiveAsync(watcherToken, Ct);
        var arrival = watcherLive.NextAsync<PresenceResponse>(
            nameof(IRealtimeClient.PresenceChanged), Ct, presence => presence.UserId == alice.Id);

        await using var aliceLive = await factory.ConnectLiveAsync(aliceToken, Ct);

        var arrived = await arrival;
        arrived.Online.Should().BeTrue();
        arrived.LastSeenAt.Should().NotBeNull();
        (await PresenceOfAsync(watcher, alice.Id)).Should().BeEquivalentTo(new { UserId = alice.Id, Online = true });
    }

    [Fact]
    public async Task A_member_goes_offline_a_moment_after_their_last_tab_closes()
    {
        var (watcher, _, watcherToken) = await factory.SignedInWithTokenAsync(Ct);
        var (_, alice, aliceToken) = await factory.SignedInWithTokenAsync(Ct);
        await using var watcherLive = await factory.ConnectLiveAsync(watcherToken, Ct);
        var arrival = watcherLive.NextAsync<PresenceResponse>(
            nameof(IRealtimeClient.PresenceChanged), Ct, presence => presence.UserId == alice.Id && presence.Online);
        var departure = watcherLive.NextAsync<PresenceResponse>(
            nameof(IRealtimeClient.PresenceChanged), Ct, presence => presence.UserId == alice.Id && !presence.Online);
        var firstTab = await factory.ConnectLiveAsync(aliceToken, Ct);
        var secondTab = await factory.ConnectLiveAsync(aliceToken, Ct);
        await arrival;

        await firstTab.DisposeAsync();
        (await PresenceOfAsync(watcher, alice.Id)).Online.Should().BeTrue("a tab is still open");
        await secondTab.DisposeAsync();

        var left = await departure;
        var afterwards = await PresenceOfAsync(watcher, alice.Id);
        afterwards.Online.Should().BeFalse();
        afterwards.LastSeenAt.Should().BeCloseTo(left.LastSeenAt!.Value, TimeSpan.FromMilliseconds(1));
    }

    [Fact]
    public async Task Whos_around_puts_online_members_first_and_never_the_viewer()
    {
        var (viewer, viewerUser, viewerToken) = await factory.SignedInWithTokenAsync(Ct);
        var (_, alice, aliceToken) = await factory.SignedInWithTokenAsync(Ct);
        await using var viewerLive = await factory.ConnectLiveAsync(viewerToken, Ct);
        var arrival = viewerLive.NextAsync<PresenceResponse>(
            nameof(IRealtimeClient.PresenceChanged), Ct, presence => presence.UserId == alice.Id);
        await using var aliceLive = await factory.ConnectLiveAsync(aliceToken, Ct);
        await arrival;

        var around = await viewer.GetJsonAsync<List<MemberPresenceResponse>>($"{PresencePath}/around?limit=20", Ct);

        around.Should().Contain(member => member.User.Id == alice.Id && member.Online);
        around.Should().NotContain(member => member.User.Id == viewerUser.Id);
        around.Select(member => member.Online).Should().BeInDescendingOrder("everyone online comes first");
    }

    [Fact]
    public async Task Members_who_never_connected_are_offline_with_no_last_seen()
    {
        var (viewer, _) = await factory.SignedInClientAsync(Ct);
        var (_, stranger) = await factory.SignedInClientAsync(Ct);

        (await PresenceOfAsync(viewer, stranger.Id)).Should().BeEquivalentTo(
            new PresenceResponse(stranger.Id, Online: false, LastSeenAt: null));
    }

    [Fact]
    public async Task A_connection_that_fails_to_open_does_not_keep_the_member_online()
    {
        var (watcher, _, _) = await factory.SignedInWithTokenAsync(Ct);
        var (_, alice, _) = await factory.SignedInWithTokenAsync(Ct);
        using var scope = factory.Services.CreateScope();
        var presence = scope.ServiceProvider.GetRequiredService<PresenceService>();

        // The tab closed mid-handshake.
        var connect = () => presence.ConnectedAsync(alice.Id, new CancellationToken(canceled: true));

        await connect.Should().ThrowAsync<OperationCanceledException>();
        var deadline = DateTime.UtcNow.AddSeconds(5);
        while ((await PresenceOfAsync(watcher, alice.Id)).Online && DateTime.UtcNow < deadline)
        {
            await Task.Delay(100, Ct);
        }

        (await PresenceOfAsync(watcher, alice.Id)).Online.Should().BeFalse();
    }

    [Fact]
    public async Task Presence_is_for_signed_in_members()
    {
        var guest = factory.CreateClient();

        (await guest.GetAsync($"{PresencePath}?ids=1", Ct)).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await guest.GetAsync($"{PresencePath}/around", Ct)).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(101)]
    public async Task Asking_about_nobody_or_too_many_names_the_problem(int count)
    {
        var (viewer, _) = await factory.SignedInClientAsync(Ct);
        var query = string.Join('&', Enumerable.Range(1, count).Select(id => $"ids={id}"));

        var response = await viewer.GetAsync($"{PresencePath}?{query}", Ct);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var problem = await response.ReadAsync<JsonElement>(Ct);
        problem.GetProperty("errors").EnumerateObject().Select(error => error.Name).Should().Equal("ids");
    }

    private static async Task<PresenceResponse> PresenceOfAsync(HttpClient viewer, long userId) =>
        (await viewer.GetJsonAsync<List<PresenceResponse>>($"{PresencePath}?ids={userId}", Ct)).Should().ContainSingle().Subject;
}
