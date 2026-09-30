using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using Sparks.Api.Ai.Services;
using Sparks.Api.Common.Constants;
using Sparks.Api.Posts.Data;

namespace Sparks.Api.Ai.Providers;

/// <summary>
/// Writes drafts with Google Gemini's <c>generateContent</c> API. The reply
/// is constrained to a JSON schema, so the draft and the image description
/// come back as separate fields instead of text to pick apart.
/// </summary>
public sealed class GeminiSparkWriter(HttpClient http, IOptions<GeminiOptions> options, ILogger<GeminiSparkWriter> logger)
    : ISparkWriter
{
    public const string BaseAddress = "https://generativelanguage.googleapis.com/";

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public async Task<SparkDraft> DraftAsync(SparkKind kind, string prompt, CancellationToken ct)
    {
        var brief = SparkBriefs.For(kind);
        var instructions = brief.HasImage
            ? $"{SparkBriefs.Rules}\n\n{brief.Instructions}\n\n{SparkBriefs.ImagePromptRules} The picture is {brief.ImageStyle}."
            : $"{SparkBriefs.Rules}\n\n{brief.Instructions}";

        var request = new GenerateContentRequest(
            SystemInstruction: new Content([new Part(instructions)]),
            Contents: [new Content([new Part(prompt)], Role: "user")],
            GenerationConfig: new GenerationConfig(
                Temperature: 0.9,
                MaxOutputTokens: 1024,
                ResponseMimeType: "application/json",
                ResponseSchema: brief.HasImage ? DraftWithImageSchema : DraftSchema));

        var model = Uri.EscapeDataString(options.Value.Model);
        using var message = new HttpRequestMessage(HttpMethod.Post, $"v1beta/models/{model}:generateContent")
        {
            Content = JsonContent.Create(request, options: Json),
        };
        message.Headers.Add("x-goog-api-key", options.Value.ApiKey);

        GenerateContentResponse? result;
        try
        {
            using var response = await http.SendAsync(message, ct);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Gemini answered {StatusCode}", (int)response.StatusCode);
                throw AiErrors.Unavailable();
            }

            result = await response.Content.ReadFromJsonAsync<GenerateContentResponse>(Json, ct);
        }
        catch (Exception ex) when (ex is HttpRequestException or JsonException
            || (ex is TaskCanceledException && !ct.IsCancellationRequested))
        {
            logger.LogWarning(ex, "Gemini couldn't be reached or answered with something unreadable");
            throw AiErrors.Unavailable();
        }

        var candidate = result?.Candidates?.FirstOrDefault();
        if (result?.PromptFeedback?.BlockReason is not null || candidate?.FinishReason is "SAFETY" or "PROHIBITED_CONTENT" or "BLOCKLIST")
        {
            throw AiErrors.Declined();
        }

        var text = candidate?.Content?.Parts?.FirstOrDefault()?.Text;
        DraftJson? draft = null;
        try
        {
            draft = text is null ? null : JsonSerializer.Deserialize<DraftJson>(text, Json);
        }
        catch (JsonException ex)
        {
            logger.LogWarning(ex, "Gemini's draft wasn't the JSON asked for");
        }

        if (string.IsNullOrWhiteSpace(draft?.Body))
        {
            throw AiErrors.Unavailable();
        }

        return new SparkDraft(
            Clip(draft.Body, InputLimits.PostBodyMaxLength),
            brief.HasImage && !string.IsNullOrWhiteSpace(draft.ImagePrompt)
                ? Clip(draft.ImagePrompt, InputLimits.AiPromptMaxLength)
                : null);
    }

    private static string Clip(string text, int maxLength)
    {
        text = text.Trim();
        return text.Length <= maxLength ? text : text[..maxLength];
    }

    private static readonly object DraftSchema = new
    {
        type = "OBJECT",
        properties = new { body = new { type = "STRING" } },
        required = new[] { "body" },
    };

    private static readonly object DraftWithImageSchema = new
    {
        type = "OBJECT",
        properties = new { body = new { type = "STRING" }, imagePrompt = new { type = "STRING" } },
        required = new[] { "body", "imagePrompt" },
    };

    private sealed record GenerateContentRequest(
        Content SystemInstruction, IReadOnlyList<Content> Contents, GenerationConfig GenerationConfig);

    private sealed record Content(IReadOnlyList<Part>? Parts, string? Role = null);

    private sealed record Part(string? Text);

    private sealed record GenerationConfig(
        double Temperature, int MaxOutputTokens, string ResponseMimeType, object ResponseSchema);

    private sealed record GenerateContentResponse(IReadOnlyList<Candidate>? Candidates, PromptFeedback? PromptFeedback);

    private sealed record Candidate(Content? Content, string? FinishReason);

    private sealed record PromptFeedback(string? BlockReason);

    private sealed record DraftJson(string? Body, string? ImagePrompt);
}
