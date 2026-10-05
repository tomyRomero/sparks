using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Sparks.Api.Chat.Data;

internal sealed class ConversationEntityConfiguration : IEntityTypeConfiguration<ConversationEntity>
{
    public void Configure(EntityTypeBuilder<ConversationEntity> builder)
    {
        // Ordering the pair makes (A, B) and (B, A) the same row, so the unique
        // index below allows one conversation per pair. It also rules out a
        // conversation with yourself.
        builder.ToTable("conversations", table =>
            table.HasCheckConstraint("ck_conversations_user_order", "[user_a_id] < [user_b_id]"));

        builder.HasOne(conversation => conversation.UserA)
            .WithMany()
            .HasForeignKey(conversation => conversation.UserAId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(conversation => conversation.UserB)
            .WithMany()
            .HasForeignKey(conversation => conversation.UserBId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(conversation => new { conversation.UserAId, conversation.UserBId }).IsUnique();
        // The unique index finds a user's conversations when they're user A;
        // this one finds them when they're user B.
        builder.HasIndex(conversation => conversation.UserBId);
    }
}
