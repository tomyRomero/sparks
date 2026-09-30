using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sparks.Api.Common.Constants;

namespace Sparks.Api.Posts.Data;

internal sealed class CommentEntityConfiguration : IEntityTypeConfiguration<CommentEntity>
{
    public void Configure(EntityTypeBuilder<CommentEntity> builder)
    {
        builder.ToTable("comments");

        builder.Property(comment => comment.Body).HasMaxLength(InputLimits.CommentBodyMaxLength);

        // Deleting a post removes its whole thread in one statement, replies
        // included, because every comment carries the post's id.
        builder.HasOne(comment => comment.Post)
            .WithMany(post => post.Comments)
            .HasForeignKey(comment => comment.PostId)
            .OnDelete(DeleteBehavior.Cascade);

        // SQL Server can't cascade through a self-reference. Deleting a single
        // comment removes its replies in the service, inside one transaction.
        builder.HasOne(comment => comment.ParentComment)
            .WithMany(comment => comment.Replies)
            .HasForeignKey(comment => comment.ParentCommentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(comment => comment.Author)
            .WithMany()
            .HasForeignKey(comment => comment.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        // A thread in order, and a profile's comments newest first.
        builder.HasIndex(comment => new { comment.PostId, comment.Id });
        builder.HasIndex(comment => new { comment.AuthorId, comment.Id });
    }
}
