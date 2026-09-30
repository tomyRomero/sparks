using Microsoft.AspNetCore.Mvc;

namespace Sparks.Api.Common.Http;

public static class ProblemResults
{
    /// <summary>
    /// A problem-details response with a machine-readable <c>code</c>, so the
    /// frontend can react to the error without parsing its wording.
    /// </summary>
    public static ObjectResult CodedProblem(this ControllerBase controller, int statusCode, string code, string title)
    {
        var problem = controller.ProblemDetailsFactory.CreateProblemDetails(
            controller.HttpContext, statusCode, title);
        problem.Extensions["code"] = code;
        return new ObjectResult(problem)
        {
            StatusCode = statusCode,
            ContentTypes = { "application/problem+json" },
        };
    }
}
