namespace Sparks.Api.Storage;

/// <summary>The image formats Sparks accepts. SVG isn't one: it can carry script.</summary>
public enum ImageFormat
{
    Png,
    Jpeg,
    Gif,
    WebP,
}

public static class ImageFormats
{
    /// <summary>How many bytes <see cref="Detect"/> needs to see.</summary>
    public const int HeaderLength = 12;

    /// <summary>
    /// The format the file's first bytes show, whatever its name or declared
    /// content type claim; null if it isn't an accepted image.
    /// </summary>
    public static ImageFormat? Detect(ReadOnlySpan<byte> header) => header switch
    {
        [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, ..] => ImageFormat.Png,
        [0xFF, 0xD8, 0xFF, ..] => ImageFormat.Jpeg,
        [(byte)'G', (byte)'I', (byte)'F', (byte)'8', (byte)'7' or (byte)'9', (byte)'a', ..] => ImageFormat.Gif,
        [(byte)'R', (byte)'I', (byte)'F', (byte)'F', _, _, _, _, (byte)'W', (byte)'E', (byte)'B', (byte)'P', ..] => ImageFormat.WebP,
        _ => null,
    };

    public static string Extension(this ImageFormat format) => format switch
    {
        ImageFormat.Png => "png",
        ImageFormat.Jpeg => "jpg",
        ImageFormat.Gif => "gif",
        ImageFormat.WebP => "webp",
        _ => throw new ArgumentOutOfRangeException(nameof(format)),
    };

    public static string ContentType(this ImageFormat format) => format switch
    {
        ImageFormat.Png => "image/png",
        ImageFormat.Jpeg => "image/jpeg",
        ImageFormat.Gif => "image/gif",
        ImageFormat.WebP => "image/webp",
        _ => throw new ArgumentOutOfRangeException(nameof(format)),
    };
}
