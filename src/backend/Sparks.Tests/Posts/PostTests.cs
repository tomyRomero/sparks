using System.Net;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Time.Testing;
using Sparks.Api;
using Sparks.Api.Common.Models;
using Sparks.Api.Posts.Data;
using Sparks.Api.Posts.Models;
using Sparks.Api.Search;
using Sparks.Tests.Infrastructure;

namespace Sparks.Tests.Posts;

/// <summary>
/// The feed, single posts, and who may write, change and like them. The
/// database is shared, so feed tests search for a word only their own posts
/// contain.
/// </summary>
public sealed class PostTests(SparksApiFactory factory)
{
    private const string PostsPath = "/api/v1/posts";

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Anyone_can_read_the_feed_newest_first()
    {
        var (author, _) = await factory.SignedInClientAsync(Ct);
        var word = UniqueWord();
        var created = new List<long>();
        for (var i = 0; i < 3; i++)
        {
            created.Add((await author.CreatePostAsync($"{word} number {i}", Ct)).Id);
        }

        var feed = await factory.CreateClient().GetJsonAsync<CursorPage<PostResponse>>($"{PostsPath}?q={word}", Ct);

        feed.Items.Select(post => post.Id).Should().Equal(created.AsEnumerable().Reverse());
        feed.Items.Should().OnlyContain(post => !post.LikedByMe);
    }

    [Fact]
    public async Task The_feed_pages_with_a_cursor()
    {
        var (author, _) = await factory.SignedInClientAsync(Ct);
        var word = UniqueWord();
        for (var i = 0; i < 3; i++)
        {
            await author.CreatePostAsync($"{word} {i}", Ct);
        }

        var reader = factory.CreateClient();
        var first = await reader.GetJsonAsync<CursorPage<PostResponse>>($"{PostsPath}?q={word}&limit=2", Ct);
        var second = await reader.GetJsonAsync<CursorPage<PostResponse>>(
            $"{PostsPath}?q={word}&limit=2&cursor={first.NextCursor}", Ct);

        first.Items.Should().HaveCount(2);
        first.NextCursor.Should().Be(first.Items[^1].Id);
        second.Items.Should().ContainSingle().Which.Id.Should().BeLessThan(first.Items[^1].Id);
        second.NextCursor.Should().BeNull();
    }

    [Fact]
    public async Task Search_matches_the_text_or_the_author_but_treats_wildcards_literally()
    {
        var (author, user) = await factory.SignedInClientAsync(Ct);
        var word = UniqueWord();
        var post = await author.CreatePostAsync($"A spark about {word}", Ct);
        var reader = factory.CreateClient();

        var byText = await reader.GetJsonAsync<CursorPage<PostResponse>>($"{PostsPath}?q={word.ToUpperInvariant()}", Ct);
        var byAuthor = await reader.GetJsonAsync<CursorPage<PostResponse>>($"{PostsPath}?q={user.Username}", Ct);
        var byWildcard = await reader.GetJsonAsync<CursorPage<PostResponse>>($"{PostsPath}?q=%25&limit=50", Ct);

        byText.Items.Should().ContainSingle(item => item.Id == post.Id);
        byAuthor.Items.Should().ContainSingle(item => item.Id == post.Id);
        byWildcard.Items.Should().NotContain(item => item.Id == post.Id);
    }

    [Fact]
    public async Task The_feed_filters_by_kind()
    {
        var (author, _) = await factory.SignedInClientAsync(Ct);
        var word = UniqueWord();
        var haiku = await author.CreatePostAsync($"{word} in five seven five", SparkKind.Haiku, Ct);
        await author.CreatePostAsync($"{word} walks into a bar", SparkKind.Joke, Ct);

        var feed = await factory.CreateClient()
            .GetJsonAsync<CursorPage<PostResponse>>($"{PostsPath}?q={word}&kind=haiku", Ct);

        feed.Items.Should().ContainSingle().Which.Id.Should().Be(haiku.Id);
    }

    [Fact]
    public async Task The_feed_takes_several_kinds_and_can_keep_only_pictures()
    {
        var (author, _) = await factory.SignedInClientAsync(Ct);
        var word = UniqueWord();
        var haiku = await author.CreatePostAsync($"{word} in five seven five", SparkKind.Haiku, Ct);
        var joke = await author.CreatePostAsync($"{word} walks into a bar", SparkKind.Joke, Ct);
        await author.CreatePostAsync($"{word} said nobody", SparkKind.Quote, Ct);
        var photo = await author.CreatePictureAsync($"{word} at dusk", SparkKind.Photography, Ct);
        var reader = factory.CreateClient();

        var twoKinds = await reader.GetJsonAsync<CursorPage<PostResponse>>($"{PostsPath}?q={word}&kind=haiku&kind=joke", Ct);
        var pictures = await reader.GetJsonAsync<CursorPage<PostResponse>>($"{PostsPath}?q={word}&pictures=true", Ct);

        twoKinds.Items.Select(post => post.Id).Should().BeEquivalentTo([haiku.Id, joke.Id]);
        pictures.Items.Should().ContainSingle().Which.Id.Should().Be(photo.Id);
    }

    [Fact]
    public async Task Top_lists_the_weeks_most_liked_posts_a_page_at_a_time()
    {
        // A clock of its own, far ahead, so only this test's posts are in the week.
        var clock = new FakeTimeProvider(DateTimeOffset.UtcNow.AddYears(1));
        using var api = factory.WithWebHostBuilder(builder =>
            builder.ConfigureTestServices(services => services.AddSingleton<TimeProvider>(clock)));
        var (author, _) = await api.SignedInClientAsync(Ct);
        var quiet = await author.CreatePostAsync("Quiet", Ct);
        var loved = await author.CreatePostAsync("Loved", Ct);
        var liked = await author.CreatePostAsync("Liked", Ct);
        foreach (var (post, likes) in new[] { (loved, 2), (liked, 1) })
        {
            for (var i = 0; i < likes; i++)
            {
                var (fan, _) = await api.SignedInClientAsync(Ct);
                (await fan.PutAsync($"{PostsPath}/{post.Id}/like", content: null, Ct)).EnsureSuccessStatusCode();
            }
        }

        var reader = api.CreateClient();
        var first = await reader.GetJsonAsync<OpaqueCursorPage<PostResponse>>($"{PostsPath}/top?limit=2", Ct);
        var second = await reader.GetJsonAsync<OpaqueCursorPage<PostResponse>>(
            $"{PostsPath}/top?limit=2&cursor={Uri.EscapeDataString(first.NextCursor!)}", Ct);

        first.Items.Select(post => post.Id).Should().Equal(loved.Id, liked.Id);
        second.Items.Select(post => post.Id).Should().Equal(quiet.Id);
        second.NextCursor.Should().BeNull();
    }

    [Fact]
    public async Task Top_keeps_a_shared_ranking_for_a_minute_but_reads_counts_fresh()
    {
        // Two years ahead, so the other Top test's week doesn't overlap this one.
        var clock = new FakeTimeProvider(DateTimeOffset.UtcNow.AddYears(2));
        using var api = factory.WithWebHostBuilder(builder =>
            builder.ConfigureTestServices(services => services.AddSingleton<TimeProvider>(clock)));
        var (author, _) = await api.SignedInClientAsync(Ct);
        var older = await author.CreatePostAsync("Liked first", Ct);
        var newer = await author.CreatePostAsync("Liked later", Ct);
        await LikeAsync(api, older, fans: 1);
        var reader = api.CreateClient();
        var before = await reader.GetJsonAsync<OpaqueCursorPage<PostResponse>>($"{PostsPath}/top?limit=2", Ct);

        await LikeAsync(api, newer, fans: 2);
        var after = await reader.GetJsonAsync<OpaqueCursorPage<PostResponse>>($"{PostsPath}/top?limit=2", Ct);
        var following = await author.GetJsonAsync<OpaqueCursorPage<PostResponse>>(
            $"{PostsPath}/top?limit=2&following=true", Ct);

        before.Items.Select(post => post.Id).Should().Equal(older.Id, newer.Id);
        after.Items.Select(post => post.Id).Should().Equal([older.Id, newer.Id], "everyone shares one ranking for a minute");
        after.Items.Select(post => post.LikeCount).Should().Equal(1, 2);
        following.Items.Select(post => post.Id).Should().Equal([newer.Id, older.Id], "a Following ranking is the viewer's own");
    }

    private static async Task LikeAsync(WebApplicationFactory<Program> api, PostResponse post, int fans)
    {
        for (var i = 0; i < fans; i++)
        {
            var (fan, _) = await api.SignedInClientAsync(Ct);
            (await fan.PutAsync($"{PostsPath}/{post.Id}/like", content: null, Ct)).EnsureSuccessStatusCode();
        }
    }

    [Fact]
    public async Task Search_counts_sparks_and_members()
    {
        var (author, authorUser) = await factory.SignedInClientAsync(Ct);
        await author.CreatePostAsync("First", Ct);
        await author.CreatePostAsync("Second", Ct);

        var counts = await factory.CreateClient()
            .GetJsonAsync<SearchCounts>($"/api/v1/search/counts?q={authorUser.Username}", Ct);

        counts.Should().Be(new SearchCounts(Sparks: 2, Members: 1));
    }

    [Fact]
    public async Task Writing_a_post_requires_sign_in()
    {
        var response = await factory.CreateClient().PostJsonAsync(
            PostsPath, new CreatePostRequest { Kind = SparkKind.Regular, Body = "Hello" }, Ct);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task A_new_post_comes_back_with_its_author_and_location()
    {
        var (author, user) = await factory.SignedInClientAsync(Ct);

        var response = await author.PostJsonAsync(
            PostsPath,
            new CreatePostRequest { Kind = SparkKind.Quote, Body = "  Stay curious.  ", AiPrompt = "a short quote" },
            Ct);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var post = await response.ReadAsync<PostResponse>(Ct);
        response.Headers.Location!.ToString().Should().EndWith($"{PostsPath}/{post.Id}");
        post.Should().BeEquivalentTo(new
        {
            Kind = SparkKind.Quote,
            Body = "Stay curious.",
            AiPrompt = "a short quote",
            LikeCount = 0,
            CommentCount = 0,
            LikedByMe = false,
        });
        post.Author.Username.Should().Be(user.Username);
        post.CreatedAt.Kind.Should().Be(DateTimeKind.Utc);
    }

    [Theory]
    [InlineData("""{"body":"No kind"}""", "kind")]
    [InlineData("""{"kind":"regular","body":""}""", "body")]
    public async Task Invalid_posts_name_the_field_at_fault(string json, string field)
    {
        var (author, _) = await factory.SignedInClientAsync(Ct);

        var response = await author.PostAsync(
            PostsPath, new StringContent(json, System.Text.Encoding.UTF8, "application/json"), Ct);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var problem = await response.ReadAsync<JsonElement>(Ct);
        problem.GetProperty("errors").EnumerateObject().Select(error => error.Name).Should().Contain(field);
    }

    [Fact]
    public async Task A_numeric_kind_is_refused()
    {
        var (author, _) = await factory.SignedInClientAsync(Ct);

        var response = await author.PostAsync(
            PostsPath,
            new StringContent("""{"kind":42,"body":"Sneaky"}""", System.Text.Encoding.UTF8, "application/json"),
            Ct);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Only_the_author_can_edit_or_delete_a_post()
    {
        var (author, _) = await factory.SignedInClientAsync(Ct);
        var (stranger, _) = await factory.SignedInClientAsync(Ct);
        var post = await author.CreatePostAsync("Original words", Ct);
        var path = $"{PostsPath}/{post.Id}";

        var strangerEdit = await stranger.PatchJsonAsync(path, new UpdatePostRequest { Body = "Hijacked" }, Ct);
        var strangerDelete = await stranger.DeleteAsync(path, Ct);
        var authorEdit = await author.PatchJsonAsync(path, new UpdatePostRequest { Body = "Better words" }, Ct);

        strangerEdit.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await strangerEdit.ProblemCodeAsync(Ct)).Should().Be("NOT_YOUR_POST");
        strangerDelete.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        var edited = await authorEdit.ReadAsync<PostResponse>(Ct);
        edited.Body.Should().Be("Better words");
        edited.EditedAt.Should().NotBeNull();

        (await author.DeleteAsync(path, Ct)).StatusCode.Should().Be(HttpStatusCode.NoContent);
        var gone = await factory.CreateClient().GetAsync(path, Ct);
        gone.StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await gone.ProblemCodeAsync(Ct)).Should().Be("POST_NOT_FOUND");
    }

    [Fact]
    public async Task Likes_count_once_per_user_and_show_to_whoever_liked()
    {
        var (author, _) = await factory.SignedInClientAsync(Ct);
        var (fan, _) = await factory.SignedInClientAsync(Ct);
        var post = await author.CreatePostAsync("Like me", Ct);
        var likePath = $"{PostsPath}/{post.Id}/like";

        await fan.PutAsync(likePath, content: null, Ct);
        var secondLike = await (await fan.PutAsync(likePath, content: null, Ct)).ReadAsync<LikeState>(Ct);
        var seenByFan = await fan.GetJsonAsync<PostResponse>($"{PostsPath}/{post.Id}", Ct);
        var seenByAnyone = await factory.CreateClient().GetJsonAsync<PostResponse>($"{PostsPath}/{post.Id}", Ct);
        await fan.DeleteAsync(likePath, Ct);
        var afterUnlikes = await (await fan.DeleteAsync(likePath, Ct)).ReadAsync<LikeState>(Ct);

        secondLike.Should().Be(new LikeState(Liked: true, LikeCount: 1));
        seenByFan.LikedByMe.Should().BeTrue();
        seenByAnyone.LikedByMe.Should().BeFalse();
        seenByAnyone.LikeCount.Should().Be(1);
        afterUnlikes.Should().Be(new LikeState(Liked: false, LikeCount: 0));
    }

    [Fact]
    public async Task Liking_a_post_that_does_not_exist_is_a_404()
    {
        var (fan, _) = await factory.SignedInClientAsync(Ct);

        var response = await fan.PutAsync($"{PostsPath}/{long.MaxValue}/like", content: null, Ct);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    /// <summary>A word no other test's post contains, to find this test's posts in the shared database.</summary>
    private static string UniqueWord() => $"w{Guid.NewGuid():N}"[..16];

}
