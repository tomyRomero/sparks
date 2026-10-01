using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Sparks.Api.Common.Data;

namespace Sparks.Api.Storage;

/// <summary>
/// Deletes stored images that no post or avatar uses: pictures painted or
/// uploaded for a spark that was never shared, and files whose delete failed.
/// </summary>
public sealed class UploadSweep(
    SparksDbContext db,
    IFileStorage storage,
    IOptions<StorageOptions> options,
    TimeProvider time,
    ILogger<UploadSweep> logger)
{
    private const int BatchSize = 500;

    /// <summary>Returns how many files were deleted.</summary>
    public async Task<int> SweepAsync(CancellationToken ct)
    {
        var cutoff = time.GetUtcNow() - options.Value.KeepUnusedFor;
        var deleted = 0;
        foreach (var folder in (string[])[StorageKeys.Images, StorageKeys.Avatars])
        {
            List<string> old = [];
            await foreach (var file in storage.ListAsync(folder, ct))
            {
                if (file.StoredAt <= cutoff)
                {
                    old.Add(file.Key);
                }
            }

            foreach (var batch in old.Chunk(BatchSize))
            {
                var used = await UsedAsync(folder, batch, ct);
                foreach (var key in batch.Where(key => !used.Contains(key)))
                {
                    await storage.DeleteAsync(key, ct);
                    deleted++;
                }
            }
        }

        if (deleted > 0)
        {
            logger.LogInformation("Deleted {Count} unused uploads", deleted);
        }

        return deleted;
    }

    private async Task<HashSet<string>> UsedAsync(string folder, string[] keys, CancellationToken ct)
    {
        var used = folder == StorageKeys.Images
            ? db.Posts.Where(post => post.ImageKey != null && keys.Contains(post.ImageKey)).Select(post => post.ImageKey!)
            : db.Users.Where(user => user.AvatarKey != null && keys.Contains(user.AvatarKey)).Select(user => user.AvatarKey!);
        return [.. await used.ToListAsync(ct)];
    }
}

internal sealed class UploadSweeper(
    IServiceScopeFactory scopes,
    IOptions<StorageOptions> options,
    TimeProvider time,
    ILogger<UploadSweeper> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(options.Value.SweepEvery, time);
        do
        {
            try
            {
                await using var scope = scopes.CreateAsyncScope();
                await scope.ServiceProvider.GetRequiredService<UploadSweep>().SweepAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "Couldn't sweep unused uploads");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}

public static class FileStorageExtensions
{
    /// <summary>
    /// Deletes a file the database has just stopped using. The change is
    /// already saved, so a failure is only logged; the sweep retries it.
    /// </summary>
    public static async Task TryDeleteAsync(this IFileStorage storage, string key, ILogger logger)
    {
        try
        {
            await storage.DeleteAsync(key, CancellationToken.None);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Couldn't delete {Key}; the upload sweep will retry", key);
        }
    }
}
