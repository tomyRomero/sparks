using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Sparks.Api.Auth.Data;

internal sealed class SessionEntityConfiguration : IEntityTypeConfiguration<SessionEntity>
{
    /// <summary>Longest IPv6 address in text form.</summary>
    public const int IpAddressMaxLength = 45;
    public const int UserAgentMaxLength = 512;

    public void Configure(EntityTypeBuilder<SessionEntity> builder)
    {
        builder.ToTable("sessions");

        builder.Property(session => session.IpAddress).HasMaxLength(IpAddressMaxLength);
        builder.Property(session => session.UserAgent).HasMaxLength(UserAgentMaxLength);

        builder.HasOne(session => session.User)
            .WithMany()
            .HasForeignKey(session => session.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
