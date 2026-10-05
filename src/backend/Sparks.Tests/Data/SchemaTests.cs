using FluentAssertions;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Sparks.Api.Chat.Data;
using Sparks.Api.Posts.Data;
using Sparks.Tests.Infrastructure;

namespace Sparks.Tests.Data;

/// <summary>
/// Rules the database itself enforces, checked against real SQL Server:
/// uniqueness, check constraints, and how timestamps round-trip. They hold
/// even for writes that race past the services' own checks.
/// </summary>
public sealed class SchemaTests(SparksApiFactory factory)
{
    // SQL Server error numbers.
    private const int UniqueIndexViolation = 2601;
    private const int PrimaryKeyViolation = 2627;
    private const int ConstraintViolation = 547;

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Migrations_match_the_model()
    {
        await using var db = factory.CreateDbContext();

        db.Database.HasPendingModelChanges().Should()
            .BeFalse("every entity change needs a migration (dotnet ef migrations add)");
        (await db.Database.GetPendingMigrationsAsync(Ct)).Should().BeEmpty();
    }

    [Fact]
    public async Task Usernames_are_unique_regardless_of_case()
    {
        var username = TestData.UniqueUsername();
        await using (var db = factory.CreateDbContext())
        {
            db.Users.Add(TestData.User(username));
            await db.SaveChangesAsync(Ct);
        }

        await using var other = factory.CreateDbContext();
        other.Users.Add(TestData.User(username.ToUpperInvariant()));

        await ShouldFailWithAsync(() => other.SaveChangesAsync(Ct), UniqueIndexViolation);
    }

    [Fact]
    public async Task A_user_can_like_a_post_only_once()
    {
        var user = TestData.User();
        var post = TestData.Post(user);
        await using (var db = factory.CreateDbContext())
        {
            db.PostLikes.Add(new PostLikeEntity { Post = post, User = user, CreatedAt = DateTime.UtcNow });
            await db.SaveChangesAsync(Ct);
        }

        await using var other = factory.CreateDbContext();
        other.PostLikes.Add(new PostLikeEntity { PostId = post.Id, UserId = user.Id, CreatedAt = DateTime.UtcNow });

        await ShouldFailWithAsync(() => other.SaveChangesAsync(Ct), PrimaryKeyViolation);
    }

    [Fact]
    public async Task Posts_only_accept_known_kinds()
    {
        var post = TestData.Post(TestData.User());
        await using var db = factory.CreateDbContext();
        db.Posts.Add(post);
        await db.SaveChangesAsync(Ct);

        await ShouldFailWithAsync(
            () => db.Database.ExecuteSqlAsync($"UPDATE posts SET kind = 'Poem' WHERE id = {post.Id}", Ct),
            ConstraintViolation);
    }

    [Fact]
    public async Task Each_pair_of_users_has_at_most_one_conversation()
    {
        var (first, second) = (TestData.User(), TestData.User());
        await using (var db = factory.CreateDbContext())
        {
            db.Users.AddRange(first, second);
            await db.SaveChangesAsync(Ct);
            db.Conversations.Add(Conversation(first.Id, second.Id));
            await db.SaveChangesAsync(Ct);
        }

        await using var other = factory.CreateDbContext();
        other.Conversations.Add(Conversation(second.Id, first.Id));

        await ShouldFailWithAsync(() => other.SaveChangesAsync(Ct), UniqueIndexViolation);
    }

    [Fact]
    public async Task Conversations_store_the_pair_in_order_and_never_with_yourself()
    {
        var (first, second) = (TestData.User(), TestData.User());
        await using var db = factory.CreateDbContext();
        db.Users.AddRange(first, second);
        await db.SaveChangesAsync(Ct);
        var (lower, higher) = ConversationEntity.OrderPair(first.Id, second.Id);

        await ShouldFailWithAsync(
            () => db.Database.ExecuteSqlAsync(
                $"INSERT INTO conversations (user_a_id, user_b_id, created_at, last_message_at) VALUES ({higher}, {lower}, SYSUTCDATETIME(), SYSUTCDATETIME())",
                Ct),
            ConstraintViolation);
        await ShouldFailWithAsync(
            () => db.Database.ExecuteSqlAsync(
                $"INSERT INTO conversations (user_a_id, user_b_id, created_at, last_message_at) VALUES ({lower}, {lower}, SYSUTCDATETIME(), SYSUTCDATETIME())",
                Ct),
            ConstraintViolation);
    }

    [Fact]
    public async Task A_user_with_content_cannot_be_deleted_by_accident()
    {
        var author = TestData.User();
        await using var db = factory.CreateDbContext();
        db.Posts.Add(TestData.Post(author));
        await db.SaveChangesAsync(Ct);

        await ShouldFailWithAsync(
            () => db.Users.Where(user => user.Id == author.Id).ExecuteDeleteAsync(Ct),
            ConstraintViolation);
    }

    [Fact]
    public async Task Timestamps_come_back_as_utc()
    {
        var createdAt = new DateTime(2026, 9, 30, 12, 34, 56, DateTimeKind.Utc);
        var user = TestData.User();
        user.CreatedAt = createdAt;
        await using (var db = factory.CreateDbContext())
        {
            db.Users.Add(user);
            await db.SaveChangesAsync(Ct);
        }

        await using var other = factory.CreateDbContext();
        var stored = await other.Users.SingleAsync(row => row.Id == user.Id, Ct);

        stored.CreatedAt.Should().Be(createdAt);
        stored.CreatedAt.Kind.Should().Be(DateTimeKind.Utc);
    }

    private static ConversationEntity Conversation(long firstUserId, long secondUserId)
    {
        var (userA, userB) = ConversationEntity.OrderPair(firstUserId, secondUserId);
        return new ConversationEntity
        {
            UserAId = userA,
            UserBId = userB,
            CreatedAt = DateTime.UtcNow,
            LastMessageAt = DateTime.UtcNow,
        };
    }

    private static async Task ShouldFailWithAsync(Func<Task> action, int sqlErrorNumber)
    {
        var failure = await action.Should().ThrowAsync<Exception>();
        failure.Which.GetBaseException().Should().BeOfType<SqlException>()
            .Which.Number.Should().Be(sqlErrorNumber);
    }
}
