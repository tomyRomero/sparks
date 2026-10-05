using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace Sparks.Api.Common.Errors;

/// <summary>
/// Writes an <see cref="ApiException"/> as problem details. Any other exception
/// falls through to the default handler, which answers a generic 500.
/// </summary>
public sealed class ApiExceptionHandler(IProblemDetailsService problemDetails) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken ct)
    {
        if (exception is not ApiException apiException)
        {
            return false;
        }

        context.Response.StatusCode = apiException.StatusCode;
        return await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = context,
            ProblemDetails = new ProblemDetails
            {
                Status = apiException.StatusCode,
                Title = apiException.Message,
                Extensions = { ["code"] = apiException.Code },
            },
        });
    }
}
