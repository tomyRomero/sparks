using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sparks.Api.Common.Constants;

namespace Sparks.Api.Chat.Data;

internal sealed class MessageEntityConfiguration : IEntityTypeConfiguration<MessageEntity>
{
    public void Configure(EntityTypeBuilder<MessageEntity> builder)
    {
        builder.ToTable("messages");

        builder.Property(message => message.Body).HasMaxLength(InputLimits.MessageBodyMaxLength);

        builder.HasOne(message => message.Conversation)
            .WithMany(conversation => conversation.Messages)
            .HasForeignKey(message => message.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(message => message.Sender)
            .WithMany()
            .HasForeignKey(message => message.SenderId)
            .OnDelete(DeleteBehavior.Restrict);

        // A conversation's history in order, paged by id.
        builder.HasIndex(message => new { message.ConversationId, message.Id });
    }
}
