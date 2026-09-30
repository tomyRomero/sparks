using Microsoft.Extensions.Options;
using Sparks.Api.Common.Errors;

namespace Sparks.Api.Common.Security;

/// <summary>
/// Refuses requests that change something when a browser sends them from a
/// site other than the web app. <c>SameSite=Lax</c> cookies already keep the
/// sign-in off most cross-site requests; this is the second defence.
/// Browsers send an <c>Origin</c> header with every POST, PUT, PATCH and
/// DELETE, and with WebSocket handshakes, so anything from another origin is
/// turned away before it reaches the API. Requests without one (the web
/// app's server, command-line tools) don't come from a browser page and pass.
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
