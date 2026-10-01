using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Sparks.Api.Posts.Data;

internal sealed class PostLikeEntityConfiguration : IEntityTypeConfiguration<PostLikeEntity>
{
    public void Configure(EntityTypeBuilder<PostLikeEntity> builder)
    {
        builder.ToTable("post_likes");

        // The key is the pair, so a user can like a post at most once.
        builder.HasKey(like => new { like.PostId, like.UserId });

        builder.HasOne(like => like.Post)
            .WithMany(post => post.Likes)
            .HasForeignKey(like => like.PostId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(like => like.User)
            .WithMany()
            .HasForeignKey(like => like.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // A member's likes (the profile's Likes tab), and the user foreign key.
        builder.HasIndex(like => new { like.UserId, like.CreatedAt });
    }
}
