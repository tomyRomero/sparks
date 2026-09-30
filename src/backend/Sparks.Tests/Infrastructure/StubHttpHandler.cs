using System.Net;
using System.Text;

namespace Sparks.Tests.Infrastructure;

/// <summary>
/// Answers HTTP calls with a fixed response and remembers the request, for
/// testing API clients without the network.
/// </summary>
internal sealed class StubHttpHandler(HttpStatusCode status, string body) : HttpMessageHandler
{
    public HttpRequestMessage? Request { get; private set; }

    public string? RequestBody { get; private set; }

    public HttpClient Client(string baseAddress) => new(this) { BaseAddress = new Uri(baseAddress) };

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        Request = request;
        RequestBody = request.Content is null ? null : await request.Content.ReadAsStringAsync(cancellationToken);
        return new HttpResponseMessage(status) { Content = new StringContent(body, Encoding.UTF8, "application/json") };
    }
}
