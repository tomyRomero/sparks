using Microsoft.Extensions.Options;

namespace Sparks.Api.Storage.Services;

/// <summary>Runs <see cref="UploadSweep"/> every <see cref="StorageOptions.SweepEvery"/>.</summary>
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
