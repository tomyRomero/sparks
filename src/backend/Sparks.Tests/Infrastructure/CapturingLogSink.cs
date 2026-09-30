using System.Collections.Concurrent;
using Serilog.Core;
using Serilog.Events;

namespace Sparks.Tests.Infrastructure;

/// <summary>
/// Keeps everything a test host logs. Registered as a service, the API's
/// Serilog setup picks it up (<c>ReadFrom.Services</c>) next to the console.
/// </summary>
public sealed class CapturingLogSink : ILogEventSink
{
    private readonly ConcurrentQueue<LogEvent> _events = new();

    public IReadOnlyCollection<LogEvent> Events => _events;

    public void Emit(LogEvent logEvent) => _events.Enqueue(logEvent);
}
