using Microsoft.Extensions.Options;
using Sparks.Api.Common.Errors;

namespace Sparks.Api.Common.Security;

/// <summary>
/// Rejects writes and WebSocket handshakes whose <c>Origin</c> isn't the web
/// app, as a second layer behind SameSite cookies. Requests without an Origin
/// (the web app's server, CLI tools) pass.
/// </summary>
public sealed class OriginCheckMiddleware(RequestDelegate next, IOptions<FrontendOptions> frontend)
{
    private readonly string _allowedOrigin = frontend.Value.Origin;

    public Task InvokeAsync(HttpContext context)
    {
        var origins = context.Request.Headers.Origin;
        if (origins.Count > 0
            && IsStateChanging(context)
            && (origins.Count > 1 || !string.Equals(origins[0], _allowedOrigin, StringComparison.OrdinalIgnoreCase)))
        {
            throw ApiException.Forbidden("FOREIGN_ORIGIN", "Requests from other sites aren't accepted.");
        }

        return next(context);
    }

    private static bool IsStateChanging(HttpContext context)
    {
        var method = context.Request.Method;
        return context.WebSockets.IsWebSocketRequest
            || !(HttpMethods.IsGet(method) || HttpMethods.IsHead(method) || HttpMethods.IsOptions(method));
    }
}
