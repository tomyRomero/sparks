using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Sparks.Api.Common;

namespace Sparks.Tests.Infrastructure;

/// <summary>
/// Hosts the API in memory under the <c>Testing</c> environment.
/// </summary>
public class SparksApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment(HostEnvironmentExtensions.Testing);
    }
}
