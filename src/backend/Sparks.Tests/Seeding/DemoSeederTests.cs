using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Sparks.Api.Activity.Models;
using Sparks.Api.Chat.Models;
using Sparks.Api.Common.Models;
using Sparks.Api.Posts.Data;
using Sparks.Api.Posts.Models;
using Sparks.Api.Seeding;
using Sparks.Api.Users.Models;
using Sparks.Tests.Infrastructure;

namespace Sparks.Tests.Seeding;

/// <summary>The demo data: seeded once, through the real services, ready to sign in to.</summary>
public sealed class DemoSeederTests(SparksApiFactory factory)
{
    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Seeding_fills_the_database_once_with_a_member_ready_to_sign_in()
    {
        var first = await SeedAsync();
        var second = await SeedAsync();
        var nova = factory.CreateClient();
        var signIn = await nova.LogInAsync(DemoSeeder.MainUsername, AuthHelpers.Password, Ct);

        first.Should().BeTrue();
        second.Should().BeFalse("seeding twice would duplicate everything");
        signIn.EnsureSuccessStatusCode();

        var profile = await nova.GetJsonAsync<ProfileResponse>($"/api/v1/users/{DemoSeeder.MainUsername}", Ct);
        profile.AvatarUrl.Should().NotBeNull();
        profile.PostCount.Should().BePositive();
        (await nova.GetJsonAsync<UnreadActivity>("/api/v1/activity/unread-count", Ct)).Count.Should().BePositive();
        (await nova.GetJsonAsync<UnreadMessages>("/api/v1/conversations/unread-count", Ct)).Count.Should().BePositive();
        (await nova.GetJsonAsync<OpaqueCursorPage<ConversationResponse>>("/api/v1/conversations", Ct)).Items.Should().HaveCount(3);

        var posts = await nova.GetJsonAsync<CursorPage<PostResponse>>("/api/v1/users/theo_park/posts", Ct);
        posts.Items.Should().OnlyContain(post => post.ImageUrl != null, "Theo's photography posts come with pictures");

        await using var db = factory.CreateDbContext();
        var seededKinds = await db.Posts
            .Where(post => post.Author.Email.EndsWith("@sparks.test"))
            .Select(post => post.Kind)
            .Distinct()
            .ToListAsync(Ct);
        seededKinds.Should().BeEquivalentTo(Enum.GetValues<SparkKind>(), "the demo shows every kind of spark");
    }

    private async Task<bool> SeedAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        return await ActivatorUtilities.CreateInstance<DemoSeeder>(scope.ServiceProvider).RunAsync(AuthHelpers.Password, Ct);
    }
}
