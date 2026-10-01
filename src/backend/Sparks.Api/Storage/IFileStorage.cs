namespace Sparks.Api.Storage;

/// <summary>
/// Image storage by key: an S3-compatible bucket (<see cref="S3FileStorage"/>)
/// or local disk (<see cref="LocalFileStorage"/>). Keys come from
/// <see cref="StorageKeys"/>.
/// </summary>
public interface IFileStorage
{
    Task SaveAsync(string key, Stream content, CancellationToken ct);

    Task<bool> ExistsAsync(string key, CancellationToken ct);

    /// <summary>The stored file, or null if nothing is stored under the key.</summary>
    Task<Stream?> OpenReadAsync(string key, CancellationToken ct);

    /// <summary>Removes the file. Removing a file that isn't there is harmless.</summary>
    Task DeleteAsync(string key, CancellationToken ct);

    /// <summary>Every file in a folder (<see cref="StorageKeys.Images"/>, say), with when it was stored.</summary>
    IAsyncEnumerable<StoredFile> ListAsync(string folder, CancellationToken ct);
}

public sealed record StoredFile(string Key, DateTimeOffset StoredAt);
