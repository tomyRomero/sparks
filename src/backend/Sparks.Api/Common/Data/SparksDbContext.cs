using Microsoft.EntityFrameworkCore;
using Sparks.Api.Chat.Data;
using Sparks.Api.Posts.Data;
using Sparks.Api.Users.Data;

namespace Sparks.Api.Common.Data;

/// <summary>
/// The Sparks database. Each feature keeps its entities and their
/// <see cref="IEntityTypeConfiguration{TEntity}"/> in its own Data folder;
/// they're all picked up here. Table and column names are snake_case,
/// applied by convention where the context is registered.
/// </summary>
public sealed class SparksDbContext(DbContextOptions<SparksDbContext> options) : DbContext(options)
{
    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<PostEntity> Posts => Set<PostEntity>();
    public DbSet<PostLikeEntity> PostLikes => Set<PostLikeEntity>();
    public DbSet<CommentEntity> Comments => Set<CommentEntity>();
    public DbSet<CommentLikeEntity> CommentLikes => Set<CommentLikeEntity>();
    public DbSet<ConversationEntity> Conversations => Set<ConversationEntity>();
    public DbSet<MessageEntity> Messages => Set<MessageEntity>();

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder.Properties<DateTime>().HaveConversion<UtcDateTimeConverter>();
        configurationBuilder.Properties<DateTime?>().HaveConversion<UtcDateTimeConverter>();

        // Enums are stored by name: rows stay readable, and reordering an enum
        // can't silently change what existing rows mean.
        configurationBuilder.Properties<Enum>().HaveConversion<string>();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SparksDbContext).Assembly);
    }
}
