using Sparks.Api.Common.Errors;

namespace Sparks.Api.Posts.Services;

/// <summary>The problems posts and comments answer with. The frontend checks the codes.</summary>
internal static class PostErrors
{
    public static ApiException PostNotFound() =>
        ApiException.NotFound("POST_NOT_FOUND", "That post doesn't exist.");

    public static ApiException NotYourPost() =>
        ApiException.Forbidden("NOT_YOUR_POST", "Only the author can change this post.");

    public static ApiException InvalidImage() =>
        ApiException.BadRequest("INVALID_IMAGE", "That image isn't one you uploaded.");

    public static ApiException ImageAlreadyUsed() =>
        ApiException.Conflict("IMAGE_ALREADY_USED", "That image is already on another post.");

    public static ApiException CommentNotFound() =>
        ApiException.NotFound("COMMENT_NOT_FOUND", "That comment doesn't exist.");

    public static ApiException NotYourComment() =>
        ApiException.Forbidden("NOT_YOUR_COMMENT", "Only the author can change this comment.");
}
