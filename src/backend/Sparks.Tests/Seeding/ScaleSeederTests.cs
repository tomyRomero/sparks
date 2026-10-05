using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Sparks.Api.Chat.Models;
using Sparks.Api.Common.Data;
using Sparks.Api.Common.Models;
using Sparks.Api.Posts.Models;
using Sparks.Api.Seeding;
using Sparks.Api.Users.Models;
using Sparks.Tests.Infrastructure;

namespace Sparks.Tests.Seeding;

/// <summary>
/// The scale data, at a small size: written in bulk, yet consistent with what
/// the app expects, so every list pages through it cleanly. It gets a database
/// of its own, since thousands of extra members would change other tests'
/// suggestions and feeds.
/// </summary>
public sealed class ScaleSeederTests(SparksApiFactory factory)
{
    private static readonly ScaleOptions Small = new()
    {
        Members = 60,
        Sparks = 400,
        MainSparks = 40,
        Pictures = 20,
        Avatars = 6,
        Likes = 4_000,
        Comments = 800,
        ViralComments = 60,
        CommentLikes = 500,
        Follows = 900,
        MainFollowing = 20,
        MainConversations = 10,
        OtherConversations = 20,
        Messages = 600,
        LongChat = 150,
    };

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Scale_data_lands_once_and_every_list_pages_through_it()
    {
        await using var api = await factory.WithDatabaseAsync("SparksScaleTests", Ct);
        (await SeedAsync(api)).Should().BeTrue();
        (await SeedAsync(api)).Should().BeFalse("seeding twice would duplicate everything");

        var nova = api.CreateClient();
        (await nova.LogInAsync(DemoSeeder.MainUsername, AuthHelpers.Password, Ct)).EnsureSuccessStatusCode();
        var profile = await nova.GetJsonAsync<ProfileResponse>($"/api/v1/users/{DemoSeeder.MainUsername}", Ct);
        profile.FollowerCount.Should().BeGreaterThan(Small.Members / 2, "nearly everyone follows the main member");
        profile.FollowingCount.Should().BeGreaterThanOrEqualTo(Small.MainFollowing);
        profile.PostCount.Should().BeGreaterThan(Small.MainSparks);

        var followers = await PageAllAsync<MemberResponse>(nova, $"/api/v1/users/{DemoSeeder.MainUsername}/followers");
        followers.Should().HaveCount(profile.FollowerCount).And.OnlyHaveUniqueItems(member => member.Id);

        var inbox = await PageAllAsync<ConversationResponse>(nova, "/api/v1/conversations");
        inbox.Should().HaveCountGreaterThanOrEqualTo(Small.MainConversations);
        inbox.Select(conversation => conversation.LastMessageAt).Should().BeInDescendingOrder();

        await using var db = api.Services.CreateScope().ServiceProvider.GetRequiredService<SparksDbContext>();
        var longChat = await db.Conversations
            .OrderByDescending(conversation => conversation.Messages.Count)
            .Select(conversation => conversation.Id)
            .FirstAsync(Ct);
        var messages = new List<MessageResponse>();
        long? cursor = null;
        do
        {
            var page = await nova.GetJsonAsync<CursorPage<MessageResponse>>(
                $"/api/v1/conversations/{longChat}/messages?limit=50{(cursor is null ? "" : $"&cursor={cursor}")}", Ct);
            messages.AddRange(page.Items);
            cursor = page.NextCursor;
        }
        while (cursor is not null);

        messages.Should().HaveCount(Small.LongChat);
        messages.Select(message => message.Id).Should().BeInDescendingOrder().And.OnlyHaveUniqueItems();
        messages.Select(message => message.CreatedAt).Should().BeInDescendingOrder("ids follow time, as the cursors expect");

        var top = await nova.GetJsonAsync<OpaqueCursorPage<PostResponse>>("/api/v1/posts/top?days=30&limit=1", Ct);
        top.Items[0].LikeCount.Should().BeGreaterThan(Small.Members / 2, "the main member has a spark that went viral");

        // Bulk copy checked every foreign key and check constraint, so SQL Server still trusts them all.
        var untrusted = await db.Database
            .SqlQueryRaw<int>(
                "SELECT COUNT(*) AS [Value] FROM sys.foreign_keys WHERE is_not_trusted = 1 " +
                "UNION ALL SELECT COUNT(*) FROM sys.check_constraints WHERE is_not_trusted = 1")
            .ToListAsync(Ct);
        untrusted.Should().AllBeEquivalentTo(0);
    }

    private static async Task<bool> SeedAsync(WebApplicationFactory<Program> api)
    {
        await using var scope = api.Services.CreateAsyncScope();
        await ActivatorUtilities.CreateInstance<DemoSeeder>(scope.ServiceProvider).RunAsync(AuthHelpers.Password, Ct);
        return await ActivatorUtilities.CreateInstance<ScaleSeeder>(scope.ServiceProvider).RunAsync(AuthHelpers.Password, Small, Ct);
    }

    private static async Task<List<T>> PageAllAsync<T>(HttpClient client, string path)
    {
        var items = new List<T>();
        string? cursor = null;
        do
        {
            var page = await client.GetJsonAsync<OpaqueCursorPage<T>>(
                $"{path}?limit=50{(cursor is null ? "" : $"&cursor={Uri.EscapeDataString(cursor)}")}", Ct);
            items.AddRange(page.Items);
            cursor = page.NextCursor;
        }
        while (cursor is not null);

        return items;
    }
}
