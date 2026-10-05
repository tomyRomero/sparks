using Microsoft.EntityFrameworkCore;
using Sparks.Api.Users.Data;

namespace Sparks.Api.Users.Services;

internal static class UserLookup
{
    /// <summary>The id behind a username, matched without regard to case.</summary>
    public static async Task<long> IdOfAsync(this IQueryable<UserEntity> users, string username, CancellationToken ct) =>
        await users
            .Where(user => user.Username == username)
            .Select(user => (long?)user.Id)
            .SingleOrDefaultAsync(ct)
        ?? throw UserErrors.UserNotFound();
}
