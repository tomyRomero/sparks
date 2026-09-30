using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sparks.Api.Common.Constants;

namespace Sparks.Api.Users.Data;

internal sealed class UserEntityConfiguration : IEntityTypeConfiguration<UserEntity>
{
    private const string CaseInsensitiveCollation = "Latin1_General_100_CI_AS_SC";

    public void Configure(EntityTypeBuilder<UserEntity> builder)
    {
        builder.ToTable("users");

        // A case-insensitive collation, set on the column rather than inherited
        // from the server, so the unique indexes below treat "Tomy" and "tomy"
        // as the same username (and email) wherever the database runs.
        builder.Property(user => user.Username)
            .HasMaxLength(InputLimits.UsernameMaxLength)
            .UseCollation(CaseInsensitiveCollation);
        builder.HasIndex(user => user.Username).IsUnique();

        builder.Property(user => user.Email)
            .HasMaxLength(InputLimits.EmailMaxLength)
            .UseCollation(CaseInsensitiveCollation);
        builder.HasIndex(user => user.Email).IsUnique();

        builder.Property(user => user.PasswordHash).HasMaxLength(100);

        builder.Property(user => user.DisplayName).HasMaxLength(InputLimits.DisplayNameMaxLength);
        builder.Property(user => user.Bio).HasMaxLength(InputLimits.BioMaxLength);
        builder.Property(user => user.AvatarKey).HasMaxLength(InputLimits.StorageKeyMaxLength);
    }
}
