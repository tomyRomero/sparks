using System.Net;
using System.Text.Json;
using FluentAssertions;
using Sparks.Api.Ai.Models;
using Sparks.Api.Common.Security;
using Sparks.Api.Posts.Data;
using Sparks.Api.Posts.Models;
using Sparks.Api.Storage.Models;
using Sparks.Tests.Infrastructure;

namespace Sparks.Tests.Ai;

/// <summary>AI drafts and pictures through the API, with the sample providers the tests run on.</summary>
public sealed class AiTests(SparksApiFactory factory)
{
    private const string DraftsPath = "/api/v1/ai/drafts";
    private const string ImagesPath = "/api/v1/ai/images";

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Theory]
    [InlineData(SparkKind.MovieScript, true)]
    [InlineData(SparkKind.BookPlot, true)]
    [InlineData(SparkKind.Artwork, true)]
    [InlineData(SparkKind.Fashion, true)]
    [InlineData(SparkKind.Photography, true)]
    [InlineData(SparkKind.Haiku, false)]
    [InlineData(SparkKind.Quote, false)]
    [InlineData(SparkKind.Joke, false)]
    [InlineData(SparkKind.Aphorism, false)]
    public async Task Every_ai_kind_gets_a_draft_and_the_visual_ones_an_image_prompt(SparkKind kind, bool hasImage)
    {
        var (member, _) = await factory.SignedInClientAsync(Ct);

        var response = await member.PostJsonAsync(DraftsPath, new DraftRequest { Kind = kind, Prompt = "the sea at night" }, Ct);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var draft = await response.ReadAsync<DraftResponse>(Ct);
        draft.Body.Should().NotBeNullOrWhiteSpace();
        (draft.ImagePrompt is not null).Should().Be(hasImage);
    }

    [Fact]
    public async Task Regular_sparks_arent_drafted()
    {
        var (member, _) = await factory.SignedInClientAsync(Ct);

        var response = await member.PostJsonAsync(
            DraftsPath, new DraftRequest { Kind = SparkKind.Regular, Prompt = "anything" }, Ct);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await response.ProblemCodeAsync(Ct)).Should().Be("NOT_AN_AI_KIND");
    }

    [Fact]
    public async Task A_blank_prompt_names_the_prompt_field()
    {
        var (member, _) = await factory.SignedInClientAsync(Ct);

        var response = await member.PostJsonAsync(DraftsPath, new DraftRequest { Kind = SparkKind.Haiku, Prompt = " " }, Ct);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await response.ReadAsync<JsonElement>(Ct)).GetProperty("errors").EnumerateObject()
            .Select(error => error.Name).Should().Contain("prompt");
    }

    [Fact]
    public async Task A_painted_picture_is_stored_as_the_members_and_can_go_on_a_post()
    {
        var (member, user) = await factory.SignedInClientAsync(Ct);

        var painted = await member.PostJsonAsync(ImagesPath, new ImageRequest { Prompt = "A lighthouse at night" }, Ct);
        var image = await painted.ReadAsync<UploadedImage>(Ct);
        var post = await member.PostJsonAsync(
            "/api/v1/posts",
            new CreatePostRequest { Kind = SparkKind.Artwork, Body = "Tide Clock", AiPrompt = "a clock in the sea", ImageKey = image.Key },
            Ct);
        var file = await factory.CreateClient().GetAsync(image.Url, Ct);

        painted.StatusCode.Should().Be(HttpStatusCode.Created);
        image.Key.Should().StartWith($"images/{user.Id}/").And.EndWith(".png");
        post.StatusCode.Should().Be(HttpStatusCode.Created);
        (await post.ReadAsync<PostResponse>(Ct)).ImageUrl.Should().Be(image.Url);
        file.Content.Headers.ContentType!.MediaType.Should().Be("image/png");
    }

    [Fact]
    public async Task Ai_calls_are_limited_per_member()
    {
        using var api = factory.WithWebHostBuilder(builder =>
            builder.UseSetting($"{RateLimitOptions.SectionName}:{nameof(RateLimitOptions.AiPerHour)}", "2"));
        var (member, _) = await api.SignedInClientAsync(Ct);

        var statuses = new List<HttpStatusCode>();
        for (var attempt = 0; attempt < 3; attempt++)
        {
            var response = await member.PostJsonAsync(DraftsPath, new DraftRequest { Kind = SparkKind.Joke, Prompt = "cats" }, Ct);
            statuses.Add(response.StatusCode);
        }

        statuses.Should().Equal(HttpStatusCode.OK, HttpStatusCode.OK, HttpStatusCode.TooManyRequests);
    }
}
