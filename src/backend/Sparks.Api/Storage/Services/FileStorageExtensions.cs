namespace Sparks.Api.Storage.Services;

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
