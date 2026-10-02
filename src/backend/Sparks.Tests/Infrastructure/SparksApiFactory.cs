using System.Security.Cryptography;
using Docker.DotNet.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Sparks.Api.Auth.Services;
using Sparks.Api.Common;
using Sparks.Api.Common.Data;
using Sparks.Api.Common.Security;
using Sparks.Api.Presence;
using Sparks.Api.Storage;
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

    // A fresh signing key per run, so no key is ever written into the repo.
    private readonly string _jwtSecret = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));

    /// <summary>Where this run's uploaded images go: a temporary folder, removed afterwards.</summary>
    public string StorageRoot { get; } = Path.Combine(Path.GetTempPath(), $"sparks-tests-{Guid.NewGuid():N}");

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

    /// <summary>
    /// The same API against a database of its own in the same container,
    /// migrated and ready, for a test whose data would get in other tests' way.
    /// The caller disposes it.
    /// </summary>
    public async Task<WebApplicationFactory<Program>> WithDatabaseAsync(string database, CancellationToken ct)
    {
        var connectionString = new SqlConnectionStringBuilder(_sql.GetConnectionString()) { InitialCatalog = database }
            .ConnectionString;
        var api = WithWebHostBuilder(builder =>
            builder.UseSetting($"ConnectionStrings:{DatabaseServiceCollectionExtensions.ConnectionStringName}", connectionString));
        await using var scope = api.Services.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<SparksDbContext>().Database.MigrateAsync(ct);
        return api;
    }

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
        builder.UseSetting($"{JwtOptions.SectionName}:Secret", _jwtSecret);
        // Uploads go to a temporary folder; the bucket storage has its own tests
        // against a real S3 API (S3StorageTests).
        builder.UseSetting($"{StorageOptions.SectionName}:{nameof(StorageOptions.Provider)}", nameof(StorageProvider.Local));
        builder.UseSetting($"{StorageOptions.SectionName}:{nameof(StorageOptions.LocalRoot)}", StorageRoot);

        // Every test shares one client address, so the real limits would trip
        // across unrelated tests. The limiter itself has its own test.
        builder.UseSetting($"{RateLimitOptions.SectionName}:{nameof(RateLimitOptions.LoginPerMinute)}", "10000");
        builder.UseSetting($"{RateLimitOptions.SectionName}:{nameof(RateLimitOptions.SignupPerMinute)}", "10000");
        builder.UseSetting($"{RateLimitOptions.SectionName}:{nameof(RateLimitOptions.PassivePerMinute)}", "10000");
        builder.UseSetting($"{RateLimitOptions.SectionName}:{nameof(RateLimitOptions.UploadsPerHour)}", "10000");
        builder.UseSetting($"{RateLimitOptions.SectionName}:{nameof(RateLimitOptions.AiPerHour)}", "10000");

        // Members go offline within half a second of their last tab closing,
        // so tests of it don't wait for the real grace period.
        builder.UseSetting($"{PresenceOptions.SectionName}:{nameof(PresenceOptions.OfflineAfter)}", "00:00:00.3");
        builder.UseSetting($"{PresenceOptions.SectionName}:{nameof(PresenceOptions.SweepEvery)}", "00:00:00.1");
    }

    public override async ValueTask DisposeAsync()
    {
        await base.DisposeAsync();
        await _sql.DisposeAsync();
        if (Directory.Exists(StorageRoot))
        {
            Directory.Delete(StorageRoot, recursive: true);
        }
    }
}
