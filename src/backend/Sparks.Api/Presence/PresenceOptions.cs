using System.ComponentModel.DataAnnotations;

namespace Sparks.Api.Presence;

/// <summary>How long presence lingers and how often it's tidied (configuration section <c>Presence</c>).</summary>
public sealed class PresenceOptions
{
    public const string SectionName = "Presence";

    /// <summary>
    /// Grace after the last connection closes, so a reload or a token
    /// reconnect doesn't read as leaving.
    /// </summary>
    [Range(typeof(TimeSpan), "00:00:00", "00:10:00")]
    public TimeSpan OfflineAfter { get; set; } = TimeSpan.FromSeconds(15);

    /// <summary>How often members whose grace period is over are marked offline.</summary>
    [Range(typeof(TimeSpan), "00:00:00.010", "00:01:00")]
    public TimeSpan SweepEvery { get; set; } = TimeSpan.FromSeconds(5);
}
