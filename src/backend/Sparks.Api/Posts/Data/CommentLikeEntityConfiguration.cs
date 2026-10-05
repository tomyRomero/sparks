using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Sparks.Api.Posts.Data;

internal sealed class CommentLikeEntityConfiguration : IEntityTypeConfiguration<CommentLikeEntity>
{
    public void Configure(EntityTypeBuilder<CommentLikeEntity> builder)
    {
        builder.ToTable("comment_likes");

        builder.HasKey(like => new { like.CommentId, like.UserId });

        builder.HasOne(like => like.Comment)
            .WithMany(comment => comment.Likes)
            .HasForeignKey(like => like.CommentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(like => like.User)
            .WithMany()
            .HasForeignKey(like => like.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
