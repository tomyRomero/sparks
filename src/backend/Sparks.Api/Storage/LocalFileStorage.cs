using System.Runtime.CompilerServices;
using Microsoft.Extensions.Options;

namespace Sparks.Api.Storage;

/// <summary>Stores files on the API's own disk, under <see cref="StorageOptions.LocalRoot"/>.</summary>
public sealed class LocalFileStorage(IOptions<StorageOptions> options, IHostEnvironment environment) : IFileStorage
{
    private readonly string _root = Path.GetFullPath(Path.Combine(environment.ContentRootPath, options.Value.LocalRoot));

    public async Task SaveAsync(string key, Stream content, CancellationToken ct)
    {
        var path = PathOf(key);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);

        // Written under a temporary name and moved into place, so a reader
        // never sees half a file.
        var partial = path + ".partial";
        await using (var file = new FileStream(partial, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, useAsync: true))
        {
            await content.CopyToAsync(file, ct);
        }

        File.Move(partial, path);
    }

    public Task<bool> ExistsAsync(string key, CancellationToken ct) => Task.FromResult(File.Exists(PathOf(key)));

    public Task<Stream?> OpenReadAsync(string key, CancellationToken ct)
    {
        var path = PathOf(key);
        Stream? stream = File.Exists(path)
            ? new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 81920, useAsync: true)
            : null;
        return Task.FromResult(stream);
    }

    public Task DeleteAsync(string key, CancellationToken ct)
    {
        File.Delete(PathOf(key));
        return Task.CompletedTask;
    }

    public async IAsyncEnumerable<StoredFile> ListAsync(string folder, [EnumeratorCancellation] CancellationToken ct)
    {
        var directory = Path.Combine(_root, folder);
        if (!Directory.Exists(directory))
        {
            yield break;
        }

        foreach (var path in Directory.EnumerateFiles(directory, "*", SearchOption.AllDirectories))
        {
            ct.ThrowIfCancellationRequested();
            var key = Path.GetRelativePath(_root, path).Replace(Path.DirectorySeparatorChar, '/');
            if (StorageKeys.IsValid(key))
            {
                yield return new StoredFile(key, File.GetLastWriteTimeUtc(path));
            }
        }

        await Task.CompletedTask;
    }

    /// <summary>
    /// The file's path. Keys are checked against the one shape
    /// <see cref="StorageKeys"/> produces, so none can point outside the root.
    /// </summary>
    private string PathOf(string key)
    {
        if (!StorageKeys.IsValid(key))
        {
            throw new ArgumentException("Not a storage key.", nameof(key));
        }

        return Path.Combine(_root, key.Replace('/', Path.DirectorySeparatorChar));
    }
}
