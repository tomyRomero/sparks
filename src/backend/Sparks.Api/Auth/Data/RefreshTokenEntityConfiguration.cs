using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Sparks.Api.Auth.Data;

internal sealed class RefreshTokenEntityConfiguration : IEntityTypeConfiguration<RefreshTokenEntity>
{
    public void Configure(EntityTypeBuilder<RefreshTokenEntity> builder)
    {
        builder.ToTable("refresh_tokens");

        builder.Property(token => token.TokenHash).HasMaxLength(64).IsFixedLength().IsUnicode(false);
        builder.HasIndex(token => token.TokenHash).IsUnique();

        builder.HasOne(token => token.Session)
            .WithMany(session => session.RefreshTokens)
            .HasForeignKey(token => token.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        // SQL Server can't cascade through a self-reference; tokens are only
        // ever deleted together with their session.
        builder.HasOne(token => token.ReplacedBy)
            .WithOne()
            .HasForeignKey<RefreshTokenEntity>(token => token.ReplacedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
