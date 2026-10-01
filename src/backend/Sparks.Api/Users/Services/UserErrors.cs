using Sparks.Api.Common.Errors;

namespace Sparks.Api.Users.Services;

/// <summary>The problems member lookups answer with. The frontend checks the codes.</summary>
internal static class UserErrors
{
    public static ApiException UserNotFound() =>
        ApiException.NotFound("USER_NOT_FOUND", "There's no member with that username.");

    public static ApiException CannotFollowYourself() =>
        ApiException.BadRequest("CANNOT_FOLLOW_YOURSELF", "You can't follow yourself.");
}
