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

    public static UserEntity User(string? username = null) => new()
    {
        Username = username ?? UniqueUsername(),
        DisplayName = "Test User",
        CreatedAt = DateTime.UtcNow,
    };

    public static PostEntity Post(UserEntity author, SparkKind kind = SparkKind.Regular) => new()
    {
        Author = author,
        Kind = kind,
        Body = "A test spark.",
        CreatedAt = DateTime.UtcNow,
    };

    public static CommentEntity Comment(PostEntity post, UserEntity author, CommentEntity? replyTo = null) => new()
    {
        Post = post,
        Author = author,
        ParentComment = replyTo,
        Body = "A test comment.",
        CreatedAt = DateTime.UtcNow,
    };
}
