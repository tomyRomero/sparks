using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Sparks.Api.Common.Constants;
using Sparks.Api.Posts.Data;
using Sparks.Api.Users.Models;

namespace Sparks.Api.Chat.Models;

/// <summary>A conversation as the inbox shows it, from the viewer's side.</summary>
/// <param name="With">The other participant.</param>
/// <param name="LastMessage">Null until the first message is sent.</param>
/// <param name="UnreadCount">Messages from the other participant the viewer hasn't read.</param>
/// <param name="LastMessageAt">When the newest message was sent; the inbox is ordered by it.</param>
public sealed record ConversationResponse(
    long Id,
    UserSummary With,
    MessageResponse? LastMessage,
    int UnreadCount,
    DateTime LastMessageAt);

/// <param name="Body">The text; empty when the message only shares a spark.</param>
/// <param name="SharedPost">
/// The spark the message shares, if any. An empty body with no spark means
/// the shared spark has since been deleted.
/// </param>
/// <param name="ReadAt">When the recipient read it; null while unread.</param>
public sealed record MessageResponse(
    long Id,
    long ConversationId,
    long SenderId,
    string Body,
    SharedSparkResponse? SharedPost,
    DateTime CreatedAt,
    DateTime? ReadAt);

/// <summary>A spark shared in a message: enough for a preview that links to it.</summary>
/// <param name="Body">The start of its text, up to <see cref="ExcerptLength"/> characters.</param>
public sealed record SharedSparkResponse(
    long Id,
    SparkKind Kind,
    string Body,
    string? ImageUrl,
    UserSummary Author,
    DateTime CreatedAt)
{
    public const int ExcerptLength = 300;
}

/// <summary>Opens the conversation with a member, creating it the first time.</summary>
public sealed record StartConversationRequest
{
    [Required, StringLength(InputLimits.UsernameMaxLength)]
    public string Username { get; init; } = string.Empty;
}

/// <summary>A message: some text, a shared spark, or both.</summary>
public sealed record SendMessageRequest : IValidatableObject
{
    [StringLength(InputLimits.MessageBodyMaxLength)]
    public string Body { get; init; } = string.Empty;

    /// <summary>A spark to share. With one, the text can be left empty.</summary>
    [Range(1, long.MaxValue)]
    public long? SharedPostId { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Body) && SharedPostId is null)
        {
            // Named as the JSON field, like the attribute errors: MVC keys
            // these results by the name given, without the naming policy.
            yield return new ValidationResult(
                "Write a message or share a spark.", [JsonNamingPolicy.CamelCase.ConvertName(nameof(Body))]);
        }
    }
}

public sealed record MarkMessagesReadRequest
{
    /// <summary>
    /// The newest message the viewer has seen. Later ones stay unread, so a
    /// message that arrives while the chat is open isn't marked read unseen.
    /// </summary>
    [Required, Range(1, long.MaxValue)]
    public long? UpToMessageId { get; init; }
}

public sealed record UnreadMessages(int Count);
