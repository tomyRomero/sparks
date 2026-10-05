namespace Sparks.Api.Common.Security;

/// <summary>
/// Adds a fixed set of security headers to every response, errors included.
/// The API only serves JSON and images, so the policy can be strict.
/// </summary>
public sealed class SecurityHeadersMiddleware(RequestDelegate next)
{
    private static readonly KeyValuePair<string, string>[] Headers =
    [
        // Stops browsers from guessing a content type, so an uploaded file can
        // never be run as a script.
        new("X-Content-Type-Options", "nosniff"),
        // Nothing the API returns is meant to be framed or to load other content.
        new("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'"),
        new("X-Frame-Options", "DENY"),
        // API URLs can contain ids; never send them to other sites.
        new("Referrer-Policy", "no-referrer"),
    ];

    public Task InvokeAsync(HttpContext context)
    {
        context.Response.OnStarting(() =>
        {
            foreach (var (name, value) in Headers)
            {
                context.Response.Headers.TryAdd(name, value);
            }

            return Task.CompletedTask;
        });

        return next(context);
    }
}
