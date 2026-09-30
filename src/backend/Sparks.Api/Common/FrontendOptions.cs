using System.ComponentModel.DataAnnotations;

namespace Sparks.Api.Common;

/// <summary>Where the web app lives (configuration section <c>Frontend</c>), for links in emails.</summary>
public sealed class FrontendOptions
{
    public const string SectionName = "Frontend";

    [Required, Url]
    public string BaseUrl { get; set; } = string.Empty;
}
