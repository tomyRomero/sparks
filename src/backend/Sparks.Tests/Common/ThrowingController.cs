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

    /// <summary>Stands in for internal detail (a server name, a query) that must never reach a client.</summary>
    public const string SecretMessage = "internal detail 7f3a9c: db-host-7 query plan";

    [HttpGet]
    public IActionResult Throw() => throw new InvalidOperationException(SecretMessage);
}
