using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Sparks.Api.Common.Data;

namespace Sparks.Api.Storage.Services;

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
