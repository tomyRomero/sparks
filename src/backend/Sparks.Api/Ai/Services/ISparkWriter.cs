using Sparks.Api.Posts.Data;

namespace Sparks.Api.Ai.Services;

/// <summary>Drafts a spark of a given kind from the member's idea.</summary>
public interface ISparkWriter
{
    Task<SparkDraft> DraftAsync(SparkKind kind, string prompt, CancellationToken ct);
}

/// <param name="ImagePrompt">A visual description for kinds that come with a picture; null otherwise.</param>
public sealed record SparkDraft(string Body, string? ImagePrompt);
