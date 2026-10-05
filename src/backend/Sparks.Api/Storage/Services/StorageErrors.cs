using Sparks.Api.Common.Errors;

namespace Sparks.Api.Storage.Services;

/// <summary>The problems uploads and stored files answer with. The frontend checks the codes.</summary>
internal static class StorageErrors
{
    public static ApiException FileNotFound() =>
        ApiException.NotFound("FILE_NOT_FOUND", "That file doesn't exist.");

    public static ApiException EmptyFile() =>
        ApiException.BadRequest("EMPTY_FILE", "The file is empty.");

    public static ApiException ImageTooLarge(long maxBytes) =>
        ApiException.BadRequest("IMAGE_TOO_LARGE", $"Images can be up to {maxBytes / (1024 * 1024)} MB.");

    public static ApiException UnsupportedImage() =>
        ApiException.BadRequest("UNSUPPORTED_IMAGE", "Images must be PNG, JPEG, GIF or WebP.");
}
