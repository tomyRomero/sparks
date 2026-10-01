namespace Sparks.Api.Storage;

/// <summary>
/// Where images live, by key: an S3-compatible bucket such as Cloudflare R2
/// (<see cref="S3FileStorage"/>), or local disk for tests and working offline
/// (<see cref="LocalFileStorage"/>). Nothing else knows which.
/// Keys come from <see cref="StorageKeys"/> and are never taken from a client
/// unchecked.
/// </summary>
public interface IFileStorage
{
    Task SaveAsync(string key, Stream content, CancellationToken ct);

    Task<bool> ExistsAsync(string key, CancellationToken ct);

    /// <summary>The stored file, or null if nothing is stored under the key.</summary>
    Task<Stream?> OpenReadAsync(string key, CancellationToken ct);

    /// <summary>Removes the file. Removing a file that isn't there is harmless.</summary>
    Task DeleteAsync(string key, CancellationToken ct);
}
