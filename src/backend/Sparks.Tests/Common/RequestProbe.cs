using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;

namespace Sparks.Tests.Common;

/// <summary>
/// Watches a test host's requests from outside the whole pipeline: when an
/// endpoint starts, and the status a request ends with even after its client
/// has stopped listening.
/// </summary>
public sealed class RequestProbe : IStartupFilter
{
    public TaskCompletionSource Started { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);

    public TaskCompletionSource<int> Finished { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);

    public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next) => app =>
    {
        app.Use(async (context, nextMiddleware) =>
        {
            await nextMiddleware(context);
            Finished.TrySetResult(context.Response.StatusCode);
        });
        next(app);
    };
}
