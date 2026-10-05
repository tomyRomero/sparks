using System.Globalization;
using System.Text.RegularExpressions;

namespace Sparks.Api.Storage.Services;

/// <summary>
/// Keys look like <c>avatars/42/3f9c...e1.webp</c>: folder, owner id, random
/// name. The owner id lets the API check members only attach their own uploads.
/// </summary>
public static partial class StorageKeys
{
    public const string Avatars = "avatars";
    public const string Images = "images";

    public static string New(string folder, long ownerId, ImageFormat format) =>
        string.Create(CultureInfo.InvariantCulture, $"{folder}/{ownerId}/{Guid.NewGuid():N}.{format.Extension()}");

    /// <summary>Whether the key has the shape <see cref="New"/> gives, so it's safe to use as a path.</summary>
    public static bool IsValid(string key) => KeyPattern().IsMatch(key);

    /// <summary>Whether the key is a valid one in <paramref name="folder"/> belonging to <paramref name="ownerId"/>.</summary>
    public static bool BelongsTo(string key, string folder, long ownerId) =>
        IsValid(key) && key.StartsWith(string.Create(CultureInfo.InvariantCulture, $"{folder}/{ownerId}/"), StringComparison.Ordinal);

    /// <summary>The content type to serve the file with, from the extension chosen when it was saved.</summary>
    public static string ContentType(string key) => Path.GetExtension(key) switch
    {
        ".png" => ImageFormat.Png.ContentType(),
        ".jpg" => ImageFormat.Jpeg.ContentType(),
        ".gif" => ImageFormat.Gif.ContentType(),
        ".webp" => ImageFormat.WebP.ContentType(),
        _ => throw new ArgumentException("Not a storage key.", nameof(key)),
    };

    [GeneratedRegex(@"^(avatars|images)/[1-9][0-9]{0,18}/[0-9a-f]{32}\.(png|jpg|gif|webp)$")]
    private static partial Regex KeyPattern();
}
