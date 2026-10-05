using FluentAssertions;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using Sparks.Api.Presence;
using Sparks.Api.Presence.Services;

namespace Sparks.Tests.Presence;

/// <summary>The connection counts behind presence, on a clock the tests move.</summary>
public sealed class PresenceTrackerTests
{
    private static readonly TimeSpan GracePeriod = TimeSpan.FromSeconds(15);

    private readonly FakeTimeProvider _time = new();
    private readonly PresenceTracker _tracker;

    public PresenceTrackerTests() =>
        _tracker = new PresenceTracker(_time, Options.Create(new PresenceOptions { OfflineAfter = GracePeriod }));

    [Fact]
    public void Only_a_members_first_connection_brings_them_online()
    {
        _tracker.Connect(1).Should().BeTrue();
        _tracker.Connect(1).Should().BeFalse("a second tab isn't a new arrival");

        _tracker.IsOnline(1).Should().BeTrue();
        _tracker.IsOnline(2).Should().BeFalse();
        _tracker.OnlineIds().Should().Equal(1);
    }

    [Fact]
    public void A_member_leaves_once_the_grace_period_after_their_last_connection_is_over()
    {
        _tracker.Connect(1);
        _tracker.Connect(1);

        _tracker.Disconnect(1);
        _time.Advance(TimeSpan.FromMinutes(5));
        _tracker.TakeDepartures().Should().BeEmpty("a tab is still open");

        _tracker.Disconnect(1);
        var leftAt = _time.GetUtcNow().UtcDateTime;
        _time.Advance(GracePeriod - TimeSpan.FromSeconds(1));
        _tracker.TakeDepartures().Should().BeEmpty();
        _tracker.IsOnline(1).Should().BeTrue("they could be reloading the page");

        _time.Advance(TimeSpan.FromSeconds(1));
        _tracker.TakeDepartures().Should().Equal(new Departure(1, leftAt));
        _tracker.IsOnline(1).Should().BeFalse();
        _tracker.TakeDepartures().Should().BeEmpty("each departure is reported once");
    }

    [Fact]
    public void Coming_back_within_the_grace_period_is_not_a_new_arrival()
    {
        _tracker.Connect(1);
        _tracker.Disconnect(1);
        _time.Advance(TimeSpan.FromSeconds(5));

        _tracker.Connect(1).Should().BeFalse();
        _time.Advance(TimeSpan.FromMinutes(5));

        _tracker.TakeDepartures().Should().BeEmpty();
        _tracker.IsOnline(1).Should().BeTrue();
    }
}
