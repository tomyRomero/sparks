using Sparks.Api.Common.Errors;

namespace Sparks.Api.Posts.Services;

/// <summary>The problems posts answer with. The frontend checks the codes.</summary>
internal static class PostErrors
{
    public static ApiException PostNotFound() =>
        ApiException.NotFound("POST_NOT_FOUND", "That post doesn't exist.");

    public static ApiException NotYourPost() =>
        ApiException.Forbidden("NOT_YOUR_POST", "Only the author can change this post.");
}
