using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Sparks.Api.Activity.Models;
using Sparks.Api.Chat.Models;
using Sparks.Api.Posts.Data;
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

        // What the demo is for: someone to sign in as, with something waiting.
        (await nova.GetJsonAsync<UnreadActivity>("/api/v1/activity/unread-count", Ct)).Count.Should().BePositive();
        (await nova.GetJsonAsync<UnreadMessages>("/api/v1/conversations/unread-count", Ct)).Count.Should().BePositive();

        await using var db = factory.CreateDbContext();
        var seededKinds = await db.Posts
            .Where(post => post.Author.Email.EndsWith("@sparks.test"))
            .Select(post => post.Kind)
            .Distinct()
            .ToListAsync(Ct);
        seededKinds.Should().BeEquivalentTo(Enum.GetValues<SparkKind>(), "the demo shows every kind of spark");

        // A database seeded before members could follow each other gets the follows on the next run.
        var followingBefore = (await ProfileAsync(nova)).FollowingCount;
        await db.Follows.Where(follow => follow.Follower.Username == DemoSeeder.MainUsername).ExecuteDeleteAsync(Ct);
        (await SeedAsync()).Should().BeTrue();
        (await ProfileAsync(nova)).FollowingCount.Should().Be(followingBefore).And.BePositive();
    }

    private static Task<ProfileResponse> ProfileAsync(HttpClient client) =>
        client.GetJsonAsync<ProfileResponse>($"/api/v1/users/{DemoSeeder.MainUsername}", Ct);

    private async Task<bool> SeedAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        return await ActivatorUtilities.CreateInstance<DemoSeeder>(scope.ServiceProvider).RunAsync(AuthHelpers.Password, Ct);
    }
}
