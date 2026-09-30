using Microsoft.EntityFrameworkCore;

namespace Sparks.Api.Common.Data;

public static class DatabaseServiceCollectionExtensions
{
    /// <summary>Name of the connection string under <c>ConnectionStrings</c>.</summary>
    public const string ConnectionStringName = "SparksDb";

    /// <summary>
    /// Registers <see cref="SparksDbContext"/> on SQL Server. The connection
    /// string is read when a context is first created rather than at startup,
    /// so configuration added later (such as a test's own database) applies.
    /// </summary>
    public static IServiceCollection AddSparksDatabase(this IServiceCollection services)
    {
        services.AddDbContext<SparksDbContext>((provider, options) =>
        {
            var connectionString = provider.GetRequiredService<IConfiguration>()
                .GetConnectionString(ConnectionStringName);
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new InvalidOperationException(
                    $"ConnectionStrings:{ConnectionStringName} is not configured. " +
                    "For local development, run scripts/setup-dev.sh.");
            }

            options.UseSqlServer(connectionString);
        });

        return services;
    }

    /// <summary>
    /// Brings the database up to the latest migration, creating it if needed.
    /// Only for local development: deployed databases are migrated as a
    /// separate release step, so several API instances never race to migrate.
    /// </summary>
    public static async Task MigrateDatabaseAsync(this WebApplication app)
    {
        await using var scope = app.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<SparksDbContext>();
        await db.Database.MigrateAsync(app.Lifetime.ApplicationStopping);
    }
}
