using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Options;
using Sparks.Api.Ai.Services;
using Sparks.Api.Storage;

namespace Sparks.Api.Ai.Providers;

/// <summary>
/// Paints with Cloudflare Workers AI. The default model (FLUX.1 schnell)
/// answers with the image as base64 inside Cloudflare's JSON envelope.
/// </summary>
public sealed class CloudflareImageGenerator(
    HttpClient http, IOptions<CloudflareAiOptions> options, ILogger<CloudflareImageGenerator> logger) : IImageGenerator
{
    public const string BaseAddress = "https://api.cloudflare.com/";

    /// <summary>FLUX.1 schnell's most steps: the best quality it offers.</summary>
    private const int Steps = 8;

    public async Task<byte[]> GenerateAsync(string prompt, CancellationToken ct)
    {
        var settings = options.Value;
        var path = $"client/v4/accounts/{Uri.EscapeDataString(settings.AccountId)}/ai/run/{settings.Model}";
        using var message = new HttpRequestMessage(HttpMethod.Post, path)
        {
            Content = JsonContent.Create(new { prompt, steps = Steps }),
        };
        message.Headers.Authorization = new AuthenticationHeaderValue("Bearer", settings.ApiToken);

        RunResponse? result;
        try
        {
            using var response = await http.SendAsync(message, ct);
            if (!response.IsSuccessStatusCode)
            {
                // Cloudflare answers 400 when its safety filter flags a prompt,
                // among other errors; the body says which.
                var body = await response.Content.ReadAsStringAsync(ct);
                logger.LogWarning("Cloudflare Workers AI answered {StatusCode}", (int)response.StatusCode);
                throw body.Contains("NSFW", StringComparison.OrdinalIgnoreCase) ? AiErrors.Declined() : AiErrors.Unavailable();
            }

            result = await response.Content.ReadFromJsonAsync<RunResponse>(ct);
        }
        catch (Exception ex) when (ex is HttpRequestException or JsonException
            || (ex is TaskCanceledException && !ct.IsCancellationRequested))
        {
            logger.LogWarning(ex, "Cloudflare Workers AI couldn't be reached or answered with something unreadable");
            throw AiErrors.Unavailable();
        }

        var image = Decode(result?.Result?.Image);
        if (image is null || ImageFormats.Detect(image) is null)
        {
            logger.LogWarning("Cloudflare Workers AI answered without a usable image");
            throw AiErrors.Unavailable();
        }

        return image;
    }

    private static byte[]? Decode(string? base64)
    {
        if (string.IsNullOrEmpty(base64))
        {
            return null;
        }

        try
        {
            return Convert.FromBase64String(base64);
        }
        catch (FormatException)
        {
            return null;
        }
    }

    private sealed record RunResponse(RunResult? Result, bool Success);

    private sealed record RunResult(string? Image);
}
