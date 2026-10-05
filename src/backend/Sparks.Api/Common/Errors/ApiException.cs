namespace Sparks.Api.Common.Errors;

/// <summary>
/// A failure the client caused or can act on (not found, not allowed,
/// conflict). Services throw it; <see cref="ApiExceptionHandler"/> turns it
/// into a problem-details response with the status and a machine-readable code.
/// </summary>
public sealed class ApiException(int statusCode, string code, string title) : Exception(title)
{
    public int StatusCode { get; } = statusCode;
    public string Code { get; } = code;

    public static ApiException Unauthorized(string code, string title) =>
        new(StatusCodes.Status401Unauthorized, code, title);

    public static ApiException NotFound(string code, string title) =>
        new(StatusCodes.Status404NotFound, code, title);

    public static ApiException Forbidden(string code, string title) =>
        new(StatusCodes.Status403Forbidden, code, title);

    public static ApiException BadRequest(string code, string title) =>
        new(StatusCodes.Status400BadRequest, code, title);

    public static ApiException Conflict(string code, string title) =>
        new(StatusCodes.Status409Conflict, code, title);
}
