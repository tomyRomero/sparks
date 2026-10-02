namespace Sparks.Api.Storage.Models;

/// <summary>A stored image, ready to attach to a post by its key.</summary>
/// <param name="Url">Where it's served, for a preview before the post is written.</param>
public sealed record UploadedImage(string Key, string Url);
