using System.ComponentModel.DataAnnotations;

namespace Sparks.Api.Presence;

/// <summary>How long presence lingers and how often it's tidied (configuration section <c>Presence</c>).</summary>
public sealed class PresenceOptions
{
    public const string SectionName = "Presence";

    /// <summary>
    /// How long a member still counts as online after their last connection
    /// closes. Reloading a page closes it for a moment, and so does the
    /// connection reopening when its access token expires; neither should
    /// read as leaving and coming back.
    /// </summary>
    [Range(typeof(TimeSpan), "00:00:00", "00:10:00")]
    public TimeSpan OfflineAfter { get; set; } = TimeSpan.FromSeconds(15);

    /// <summary>How often members whose grace period is over are marked offline.</summary>
    [Range(typeof(TimeSpan), "00:00:00.010", "00:01:00")]
    public TimeSpan SweepEvery { get; set; } = TimeSpan.FromSeconds(5);
}
