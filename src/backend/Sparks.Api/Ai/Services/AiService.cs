using Sparks.Api.Ai.Models;
using Sparks.Api.Posts.Data;
using Sparks.Api.Storage.Models;
using Sparks.Api.Storage.Services;

namespace Sparks.Api.Ai.Services;

/// <summary>
/// AI help for writing sparks: a draft from the member's idea, and for some
/// kinds a picture. Nothing is posted here; the member edits the draft and
/// posts it like any other spark, with the picture attached by its key.
/// </summary>
public sealed class AiService(ISparkWriter writer, IImageGenerator painter, ImageUploadService images)
{
    public async Task<DraftResponse> DraftAsync(SparkKind kind, string prompt, CancellationToken ct)
    {
        if (kind == SparkKind.Regular)
        {
            throw AiErrors.NotAnAiKind();
        }

        var draft = await writer.DraftAsync(kind, prompt.Trim(), ct);
        return new DraftResponse(draft.Body, draft.ImagePrompt);
    }

    /// <summary>Paints a picture and stores it as the member's image, ready to attach to a post.</summary>
    public async Task<UploadedImage> PaintAsync(long userId, string prompt, CancellationToken ct)
    {
        var bytes = await painter.GenerateAsync(prompt.Trim(), ct);
        await using var content = new MemoryStream(bytes, writable: false);
        var key = await images.SaveAsync(content, StorageKeys.Images, userId, ct);
        return new UploadedImage(key, FileUrls.Of(key)!);
    }
}
