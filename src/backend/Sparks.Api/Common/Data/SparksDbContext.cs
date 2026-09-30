using Microsoft.EntityFrameworkCore;

namespace Sparks.Api.Common.Data;

/// <summary>
/// The Sparks database. Each feature keeps its entities and their
/// <see cref="IEntityTypeConfiguration{TEntity}"/> in its own Data folder;
/// they're all picked up here.
/// </summary>
public sealed class SparksDbContext(DbContextOptions<SparksDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SparksDbContext).Assembly);
    }
}
