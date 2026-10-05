using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Sparks.Api.Users.Data;

internal sealed class FollowEntityConfiguration : IEntityTypeConfiguration<FollowEntity>
{
    public void Configure(EntityTypeBuilder<FollowEntity> builder)
    {
        // The service refuses a self-follow first; the check keeps it out of
        // the table whatever writes to it.
        builder.ToTable("follows", table => table.HasCheckConstraint("ck_follows_not_self", "follower_id <> followee_id"));

        // The key is the pair, so a member follows another at most once. It
        // also serves "who does this member follow".
        builder.HasKey(follow => new { follow.FollowerId, follow.FolloweeId });

        // Both point at users, and SQL Server allows only one cascade path to
        // a table, so neither cascades. Members aren't deleted.
        builder.HasOne(follow => follow.Follower)
            .WithMany()
            .HasForeignKey(follow => follow.FollowerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(follow => follow.Followee)
            .WithMany()
            .HasForeignKey(follow => follow.FolloweeId)
            .OnDelete(DeleteBehavior.Restrict);

        // A member's followers, newest first: their list and their activity.
        builder.HasIndex(follow => new { follow.FolloweeId, follow.CreatedAt });
    }
}
