using Microsoft.AspNetCore.Diagnostics;

namespace Sparks.Api.Common.Errors;

/// <summary>
/// Ends requests the client abandoned with a 499 instead of a logged 500.
/// </summary>
/// <remarks>
/// ASP.NET Core does this for <see cref="OperationCanceledException"/> already,
/// but SqlClient reports a cancelled command as a <c>SqlException</c>.
/// </remarks>
public sealed class AbortedRequestHandler(ILogger<AbortedRequestHandler> logger) : IExceptionHandler
{
    public ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken ct)
    {
        if (!context.RequestAborted.IsCancellationRequested)
        {
            return ValueTask.FromResult(false);
        }

        logger.LogDebug("The client aborted the request; ignoring the {ExceptionType} it caused", exception.GetType().Name);
        context.Response.StatusCode = StatusCodes.Status499ClientClosedRequest;
        return ValueTask.FromResult(true);
    }
}
