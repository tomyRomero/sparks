using System.ComponentModel.DataAnnotations;

namespace Sparks.Api.Ai;

/// <summary>
/// Which AI providers write and paint (configuration section <c>Ai</c>).
/// Both default to the sample providers, which need no keys or network, so
/// the app runs end to end out of the box.
/// </summary>
public sealed class AiOptions
{
    public const string SectionName = "Ai";

    public AiTextProvider TextProvider { get; set; } = AiTextProvider.Sample;
    public AiImageProvider ImageProvider { get; set; } = AiImageProvider.Sample;
}

public enum AiTextProvider
{
    Sample,
    Gemini,
}

public enum AiImageProvider
{
    Sample,
    Cloudflare,
}

/// <summary>Google Gemini (section <c>Ai:Gemini</c>). The key lives in user secrets, never in the repo.</summary>
public sealed class GeminiOptions
{
    public const string SectionName = "Ai:Gemini";

    [Required]
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>
    /// A stable model on Gemini's free tier. Flash-Lite thinks only minimally
    /// by default, which suits a short creative draft: it answers fast and
    /// leaves the output budget for the draft itself.
    /// </summary>
    [Required]
    public string Model { get; set; } = "gemini-3.5-flash-lite";
}

/// <summary>Cloudflare Workers AI (section <c>Ai:Cloudflare</c>). The token lives in user secrets.</summary>
public sealed class CloudflareAiOptions
{
    public const string SectionName = "Ai:Cloudflare";

    [Required]
    public string AccountId { get; set; } = string.Empty;

    [Required]
    public string ApiToken { get; set; } = string.Empty;

    [Required]
    public string Model { get; set; } = "@cf/black-forest-labs/flux-1-schnell";
}
