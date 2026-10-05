using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using Sparks.Api.Realtime;

namespace Sparks.Tests.Infrastructure;

/// <summary>Live connections to the hub, as a browser tab holds them.</summary>
internal static class LiveConnections
{
    private static readonly TimeSpan EventTimeout = TimeSpan.FromSeconds(10);

    /// <summary>
    /// A started connection for the member the token belongs to, through the
    /// in-memory test server. Long polling, because the test server's handler
    /// carries plain HTTP requests only. It reads payloads as strictly as the
    /// web app does, so an enum sent as a number fails.
    /// </summary>
    public static async Task<HubConnection> ConnectLiveAsync(this SparksApiFactory factory, string accessToken, CancellationToken ct)
    {
        var connection = new HubConnectionBuilder()
            .WithUrl(new Uri(factory.Server.BaseAddress, RealtimeHub.Path), options =>
            {
                options.Transports = HttpTransportType.LongPolling;
                options.HttpMessageHandlerFactory = _ => factory.Server.CreateHandler();
                options.AccessTokenProvider = () => Task.FromResult<string?>(accessToken);
            })
            .AddJsonProtocol(json => json.PayloadSerializerOptions = ApiJson.Options)
            .Build();
        await connection.StartAsync(ct);
        return connection;
    }

    /// <summary>
    /// The next event of one kind the connection receives, optionally the
    /// next that matches. Listen before doing what sends it.
    /// </summary>
    public static Task<T> NextAsync<T>(
        this HubConnection connection, string eventName, CancellationToken ct, Func<T, bool>? matches = null)
    {
        var received = new TaskCompletionSource<T>(TaskCreationOptions.RunContinuationsAsynchronously);
        connection.On<T>(eventName, payload =>
        {
            if (matches is null || matches(payload))
            {
                received.TrySetResult(payload);
            }
        });
        return received.Task.WaitAsync(EventTimeout, ct);
    }
}
