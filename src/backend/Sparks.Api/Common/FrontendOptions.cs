using System.ComponentModel.DataAnnotations;

namespace Sparks.Api.Common;

/// <summary>
/// Where the web app lives (configuration section <c>Frontend</c>): the base
/// of links in emails, and the one origin allowed to call the API from a browser.
/// </summary>
public sealed class FrontendOptions
{
    public const string SectionName = "Frontend";

    [Required, Url]
    public string BaseUrl { get; set; } = string.Empty;

    /// <summary>The scheme, host and port of <see cref="BaseUrl"/>, as browsers send it in <c>Origin</c>.</summary>
    public string Origin => new Uri(BaseUrl).GetLeftPart(UriPartial.Authority);
}
