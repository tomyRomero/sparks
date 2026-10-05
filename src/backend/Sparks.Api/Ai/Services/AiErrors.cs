using Sparks.Api.Common.Errors;

namespace Sparks.Api.Ai.Services;

/// <summary>The problems AI calls answer with. The frontend checks the codes.</summary>
internal static class AiErrors
{
    public static ApiException NotAnAiKind() =>
        ApiException.BadRequest("NOT_AN_AI_KIND", "Regular sparks are written by hand.");

    /// <summary>The provider is down, slow, or answered with something unusable.</summary>
    public static ApiException Unavailable() =>
        new(StatusCodes.Status503ServiceUnavailable, "AI_UNAVAILABLE", "The AI isn't available right now. Try again in a moment.");

    /// <summary>The provider's safety filters refused the prompt.</summary>
    public static ApiException Declined() =>
        new(StatusCodes.Status422UnprocessableEntity, "PROMPT_DECLINED", "The AI declined that prompt. Try rephrasing it.");
}
