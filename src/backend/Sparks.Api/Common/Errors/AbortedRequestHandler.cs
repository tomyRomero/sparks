using Microsoft.AspNetCore.Diagnostics;

namespace Sparks.Api.Common.Errors;

/// <summary>
/// Claims any exception thrown after the client went away: nobody is left to
/// read an answer, so the request ends as a 499 instead of a logged 500.
/// </summary>
/// <remarks>
/// ASP.NET Core already does this for <see cref="OperationCanceledException"/>
/// and <see cref="IOException"/>, but SqlClient reports a command cancelled by
/// the request's token as a <c>SqlException</c> ("Operation cancelled by user"),
/// which would otherwise surface as a server error every time someone leaves a
/// page mid-request.
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
