using Docker.DotNet.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Sparks.Api.Common;
using Sparks.Api.Common.Data;
using Testcontainers.MsSql;

[assembly: AssemblyFixture(typeof(Sparks.Tests.Infrastructure.SparksApiFactory))]

namespace Sparks.Tests.Infrastructure;

/// <summary>
/// Hosts the API in memory under the <c>Testing</c> environment, against a real
/// SQL Server in a throwaway container. One instance serves the whole test run,
/// so each test creates the data it needs instead of assuming an empty database.
/// </summary>
public sealed class SparksApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private const long SqlServerMemoryBytes = 2L * 1024 * 1024 * 1024;

    // The same engine as docker-compose.yml, with the same 2 GB cap (SQL Server's
    // minimum) so a test run can't starve other containers on the machine.
    // The host port is random, so it never clashes with a running database.
    private readonly MsSqlContainer _sql = new MsSqlBuilder("mcr.microsoft.com/mssql/server:2025-latest")
        .WithCreateParameterModifier(container =>
        {
            container.HostConfig ??= new HostConfig();
            container.HostConfig.Memory = SqlServerMemoryBytes;
        })
        .Build();

    /// <summary>Connection string for the test database inside the container.</summary>
    public string ConnectionString =>
        new SqlConnectionStringBuilder(_sql.GetConnectionString()) { InitialCatalog = "SparksTests" }
            .ConnectionString;

    /// <summary>
    /// A fresh context built from the API's own registration, so tests use the
    /// same model and naming conventions as the app. The caller disposes it.
    /// </summary>
    public SparksDbContext CreateDbContext() =>
        new(Services.GetRequiredService<DbContextOptions<SparksDbContext>>());

    public async ValueTask InitializeAsync()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        await _sql.StartAsync(cancellationToken);

        await using var scope = Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<SparksDbContext>();
        await db.Database.MigrateAsync(cancellationToken);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment(HostEnvironmentExtensions.Testing);
        builder.UseSetting(
            $"ConnectionStrings:{DatabaseServiceCollectionExtensions.ConnectionStringName}",
            ConnectionString);
    }

    public override async ValueTask DisposeAsync()
    {
        await base.DisposeAsync();
        await _sql.DisposeAsync();
    }
}
