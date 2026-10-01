using Microsoft.Extensions.Options;

namespace Sparks.Api.Presence.Services;

/// <summary>Every few seconds, marks offline the members whose grace period is over.</summary>
internal sealed class PresenceSweeper(
    IServiceScopeFactory scopes,
    IOptions<PresenceOptions> options,
    TimeProvider time,
    ILogger<PresenceSweeper> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(options.Value.SweepEvery, time);
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            // One failed sweep mustn't end the loop, or stop the host with it.
            try
            {
                await using var scope = scopes.CreateAsyncScope();
                await scope.ServiceProvider.GetRequiredService<PresenceService>().SweepAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "Couldn't mark departed members offline");
            }
        }
    }
}
