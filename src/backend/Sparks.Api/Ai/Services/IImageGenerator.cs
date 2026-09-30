namespace Sparks.Api.Ai.Services;

/// <summary>Paints a picture from a description.</summary>
public interface IImageGenerator
{
    /// <summary>The image's bytes (PNG or JPEG).</summary>
    Task<byte[]> GenerateAsync(string prompt, CancellationToken ct);
}
