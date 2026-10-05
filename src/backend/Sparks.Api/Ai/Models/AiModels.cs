using System.ComponentModel.DataAnnotations;
using Sparks.Api.Common.Constants;
using Sparks.Api.Posts.Data;

namespace Sparks.Api.Ai.Models;

public sealed record DraftRequest
{
    [Required]
    public SparkKind? Kind { get; init; }

    /// <summary>The member's idea: an outline, a theme, a topic.</summary>
    [Required, StringLength(InputLimits.AiPromptMaxLength)]
    public string Prompt { get; init; } = string.Empty;
}

/// <summary>A draft the member can edit before posting.</summary>
/// <param name="ImagePrompt">
/// For kinds that come with a picture (movie, book, artwork, fashion,
/// photography): a visual description to generate it from. Null otherwise.
/// </param>
public sealed record DraftResponse(string Body, string? ImagePrompt);

public sealed record ImageRequest
{
    /// <summary>What to paint, usually a draft's <see cref="DraftResponse.ImagePrompt"/>.</summary>
    [Required, StringLength(InputLimits.AiPromptMaxLength)]
    public string Prompt { get; init; } = string.Empty;
}
