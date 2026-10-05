using Sparks.Api.Common.Errors;

namespace Sparks.Api.Chat.Services;

/// <summary>The problems conversations answer with. The frontend checks the codes.</summary>
internal static class ChatErrors
{
    /// <summary>Also what outsiders get for a conversation that exists, so ids reveal nothing.</summary>
    public static ApiException ConversationNotFound() =>
        ApiException.NotFound("CONVERSATION_NOT_FOUND", "That conversation doesn't exist.");

    public static ApiException CannotMessageYourself() =>
        ApiException.BadRequest("CANNOT_MESSAGE_YOURSELF", "You can't start a conversation with yourself.");
}
