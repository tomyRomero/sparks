using Sparks.Api.Posts.Data;
using Sparks.Api.Users.Data;

namespace Sparks.Tests.Infrastructure;

/// <summary>
/// Builders for test rows. Every test shares one database, so each value that
/// must be unique is generated rather than fixed.
/// </summary>
internal static class TestData
{
    /// <summary>A username no other test will use (fits the 30-character limit).</summary>
    public static string UniqueUsername() => $"user_{Guid.NewGuid():N}"[..24];

    /// <summary>
    /// A user row written straight to the database. It can't sign in (the hash
    /// is a placeholder); tests that sign in create accounts through the API.
    /// </summary>
    public static UserEntity User(string? username = null)
    {
        username ??= UniqueUsername();
        return new UserEntity
        {
            Username = username,
            DisplayName = "Test User",
            Email = $"{username}@example.test",
            PasswordHash = "not-a-real-hash",
            CreatedAt = DateTime.UtcNow,
        };
    }

    public static PostEntity Post(UserEntity author, SparkKind kind = SparkKind.Regular) => new()
    {
        Author = author,
        Kind = kind,
        Body = "A test spark.",
        CreatedAt = DateTime.UtcNow,
    };
}
