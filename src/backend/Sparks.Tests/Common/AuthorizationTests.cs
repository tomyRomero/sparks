using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Routing.Patterns;
using Microsoft.Extensions.DependencyInjection;
using Sparks.Tests.Infrastructure;

namespace Sparks.Tests.Common;

/// <summary>
/// What a guest can reach. Every route the API maps is called without
/// credentials, so an endpoint added later is covered without a test of its
/// own, and one opened to guests by mistake fails here.
/// </summary>
public sealed class AuthorizationTests(SparksApiFactory factory)
{
    /// <summary>Signing up and in, the health probes, and reading what's public.</summary>
    private static readonly string[] OpenToGuests =
    [
        "GET health/live",
        "GET health/ready",
        "POST api/v1/auth/signup",
        "GET api/v1/auth/username-available",
        "POST api/v1/auth/login",
        "POST api/v1/auth/refresh",
        "POST api/v1/auth/logout",
        "POST api/v1/auth/forgot-password",
        "POST api/v1/auth/reset-password",
        "GET api/v1/posts",
        "GET api/v1/posts/top",
        "GET api/v1/posts/{id:long}",
        "GET api/v1/posts/{id:long}/comments",
        "GET api/v1/comments/{id:long}",
        "GET api/v1/comments/{id:long}/replies",
        "GET api/v1/users",
        "GET api/v1/users/{username}",
        "GET api/v1/users/{username}/posts",
        "GET api/v1/users/{username}/comments",
        "GET api/v1/users/{username}/liked",
        "GET api/v1/users/{username}/followers",
        "GET api/v1/users/{username}/following",
        "GET api/v1/search/counts",
        "GET files/{**key}",
    ];

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Guests_reach_only_the_public_endpoints()
    {
        var guest = factory.CreateClient();
        var reached = new List<string>();

        foreach (var (name, method, path) in Routes())
        {
            using var request = new HttpRequestMessage(new HttpMethod(method), path);
            if (method is "POST" or "PUT" or "PATCH")
            {
                request.Content = JsonContent.Create(new { });
            }

            using var response = await guest.SendAsync(request, Ct);

            // Sign-in challenges name the scheme to use. An endpoint's own 401,
            // such as a refresh with no cookie, doesn't, and means it was reached.
            var challenged = response.StatusCode == HttpStatusCode.Unauthorized && response.Headers.WwwAuthenticate.Count > 0;
            if (!challenged)
            {
                reached.Add(name);
            }
        }

        reached.Should().BeEquivalentTo(OpenToGuests);
    }

    /// <summary>Each mapped method and route, with its parameters filled in.</summary>
    private IEnumerable<(string Name, string Method, string Path)> Routes()
    {
        var endpoints = factory.Services.GetRequiredService<EndpointDataSource>().Endpoints.OfType<RouteEndpoint>();
        foreach (var endpoint in endpoints)
        {
            var template = endpoint.RoutePattern.RawText!.TrimStart('/');
            var path = "/" + string.Join('/', endpoint.RoutePattern.PathSegments.Select(Fill));
            var methods = endpoint.Metadata.GetMetadata<HttpMethodMetadata>()?.HttpMethods ?? [HttpMethods.Get];
            foreach (var method in methods)
            {
                yield return ($"{method} {template}", method, path);
            }
        }
    }

    private static string Fill(RoutePatternPathSegment segment) =>
        string.Concat(segment.Parts.Select(part => part switch
        {
            RoutePatternLiteralPart literal => literal.Content,
            RoutePatternParameterPart { Name: "username" } => "someone",
            RoutePatternParameterPart { IsCatchAll: true } => "images/1/none.png",
            RoutePatternParameterPart => "1",
            _ => "",
        }));
}
