using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Sparks.Tests.Common;

/// <summary>
/// A test-only endpoint that always throws, added to a test host so the real
/// exception handler can be checked end to end.
/// </summary>
[ApiController]
[AllowAnonymous]
[Route(Path)]
public sealed class ThrowingController : ControllerBase
{
    public const string Path = "test/throw";
    public const string AfterAbortPath = $"{Path}/after-abort";

    /// <summary>Stands in for internal detail (a server name, a query) that must never reach a client.</summary>
    public const string SecretMessage = "internal detail 7f3a9c: db-host-7 query plan";

    [HttpGet]
    public IActionResult Throw() => throw new InvalidOperationException(SecretMessage);

    /// <summary>
    /// Waits for the client to give up, then throws something other than an
    /// <see cref="OperationCanceledException"/>, as SqlClient does when the
    /// request's token cancels a query.
    /// </summary>
    [HttpGet("after-abort")]
    public async Task<IActionResult> ThrowAfterAbort([FromServices] RequestProbe probe)
    {
        probe.Started.TrySetResult();
        try
        {
            // Bounded, so a host that never signals the abort fails the test instead of hanging it.
            await Task.Delay(TimeSpan.FromSeconds(10), HttpContext.RequestAborted);
        }
        catch (OperationCanceledException)
        {
        }

        throw new InvalidOperationException(SecretMessage);
    }
}
