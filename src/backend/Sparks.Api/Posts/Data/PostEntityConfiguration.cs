using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sparks.Api.Common.Constants;

namespace Sparks.Api.Posts.Data;

internal sealed class PostEntityConfiguration : IEntityTypeConfiguration<PostEntity>
{
    public void Configure(EntityTypeBuilder<PostEntity> builder)
    {
        // Built from the enum, so adding a kind updates the constraint in the
        // next migration.
        var kinds = string.Join(", ", Enum.GetNames<SparkKind>().Select(name => $"'{name}'"));
        builder.ToTable("posts", table => table.HasCheckConstraint("ck_posts_kind", $"[kind] IN ({kinds})"));

        builder.Property(post => post.Kind).HasMaxLength(20);
        builder.Property(post => post.Body).HasMaxLength(InputLimits.PostBodyMaxLength);
        builder.Property(post => post.ImageKey).HasMaxLength(InputLimits.StorageKeyMaxLength);
        builder.Property(post => post.AiPrompt).HasMaxLength(InputLimits.AiPromptMaxLength);

        // Deleting an account is an explicit operation that removes the user's
        // content first, never a cascade from the users table.
        builder.HasOne(post => post.Author)
            .WithMany()
            .HasForeignKey(post => post.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        // Feeds read newest first by id: a profile's posts, and posts of one kind.
        builder.HasIndex(post => new { post.AuthorId, post.Id });
        builder.HasIndex(post => new { post.Kind, post.Id });
    }
}
