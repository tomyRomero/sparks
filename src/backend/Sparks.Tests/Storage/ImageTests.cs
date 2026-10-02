using System.Net;
using System.Net.Http.Headers;
using System.Text;
using FluentAssertions;
using Sparks.Api.Auth.Models;
using Sparks.Api.Common.Security;
using Sparks.Api.Posts.Data;
using Sparks.Api.Posts.Models;
using Sparks.Api.Storage.Models;
using Sparks.Api.Storage.Services;
using Sparks.Api.Users.Models;
using Sparks.Tests.Infrastructure;

namespace Sparks.Tests.Storage;

/// <summary>Avatars and post images: what's accepted, who may use it, and when files go away.</summary>
public sealed class ImageTests(SparksApiFactory factory)
{
    private const string AvatarPath = "/api/v1/users/me/avatar";
    private const string ImagesPath = "/api/v1/images";

    /// <summary>A real 1x1 PNG.</summary>
    private static readonly byte[] Png = Convert.FromBase64String(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task An_avatar_is_served_and_shown_beside_the_members_posts()
    {
        var (member, user) = await factory.SignedInClientAsync(Ct);

        var profile = await (await member.PutAsync(AvatarPath, ImageForm(Png), Ct)).ReadAsync<ProfileResponse>(Ct);
        var post = await member.CreatePostAsync("Now with a face", Ct);
        var file = await factory.CreateClient().GetAsync(profile.AvatarUrl, Ct);

        profile.AvatarUrl.Should().MatchRegex($"^/files/avatars/{user.Id}/[0-9a-f]{{32}}\\.png$");
        post.Author.AvatarUrl.Should().Be(profile.AvatarUrl);
        (await member.GetJsonAsync<CurrentUserResponse>("/api/v1/auth/me", Ct)).AvatarUrl.Should().Be(profile.AvatarUrl);
        file.StatusCode.Should().Be(HttpStatusCode.OK);
        file.Content.Headers.ContentType!.MediaType.Should().Be("image/png");
        file.Headers.CacheControl!.ToString().Should().Contain("immutable");
        (await file.Content.ReadAsByteArrayAsync(Ct)).Should().Equal(Png);
    }

    [Fact]
    public async Task Replacing_or_removing_an_avatar_deletes_the_old_file()
    {
        var (member, _) = await factory.SignedInClientAsync(Ct);
        var reader = factory.CreateClient();

        var first = await (await member.PutAsync(AvatarPath, ImageForm(Png), Ct)).ReadAsync<ProfileResponse>(Ct);
        var second = await (await member.PutAsync(AvatarPath, ImageForm(Png), Ct)).ReadAsync<ProfileResponse>(Ct);
        var firstAfterReplace = await reader.GetAsync(first.AvatarUrl, Ct);
        var removed = await (await member.DeleteAsync(AvatarPath, Ct)).ReadAsync<ProfileResponse>(Ct);
        var secondAfterRemove = await reader.GetAsync(second.AvatarUrl, Ct);

        second.AvatarUrl.Should().NotBe(first.AvatarUrl);
        firstAfterReplace.StatusCode.Should().Be(HttpStatusCode.NotFound);
        removed.AvatarUrl.Should().BeNull();
        secondAfterRemove.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Only_real_images_within_the_size_limit_are_accepted()
    {
        var (member, _) = await factory.SignedInClientAsync(Ct);
        var disguisedScript = Encoding.UTF8.GetBytes("<svg xmlns=\"http://www.w3.org/2000/svg\" onload=\"alert(1)\"/>");
        var tooLarge = new byte[ImageUploadService.MaxAvatarBytes + 1];
        Png.CopyTo(tooLarge, 0);

        var script = await member.PutAsync(AvatarPath, ImageForm(disguisedScript, "cat.png"), Ct);
        var empty = await member.PutAsync(AvatarPath, ImageForm([]), Ct);
        var large = await member.PutAsync(AvatarPath, ImageForm(tooLarge), Ct);

        (await script.ProblemCodeAsync(Ct)).Should().Be("UNSUPPORTED_IMAGE");
        (await empty.ProblemCodeAsync(Ct)).Should().Be("EMPTY_FILE");
        (await large.ProblemCodeAsync(Ct)).Should().Be("IMAGE_TOO_LARGE");
        new[] { script, empty, large }.Should().OnlyContain(response => response.StatusCode == HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task A_post_carries_an_image_its_author_uploaded()
    {
        var (author, _) = await factory.SignedInClientAsync(Ct);

        var upload = await author.PostAsync(ImagesPath, ImageForm(Png), Ct);
        var image = await upload.ReadAsync<UploadedImage>(Ct);
        var post = await CreatePostAsync(author, image.Key);

        upload.StatusCode.Should().Be(HttpStatusCode.Created);
        upload.Headers.Location!.ToString().Should().Be(image.Url);
        post.StatusCode.Should().Be(HttpStatusCode.Created);
        (await post.ReadAsync<PostResponse>(Ct)).ImageUrl.Should().Be(image.Url);
    }

    [Fact]
    public async Task A_post_cant_use_someone_elses_image_a_missing_one_or_one_already_used()
    {
        var (alice, _) = await factory.SignedInClientAsync(Ct);
        var (bob, bobUser) = await factory.SignedInClientAsync(Ct);
        var alicesImage = await UploadAsync(alice);

        var stolen = await CreatePostAsync(bob, alicesImage.Key);
        var missing = await CreatePostAsync(bob, StorageKeys.New(StorageKeys.Images, bobUser.Id, ImageFormat.Png));
        var first = await CreatePostAsync(alice, alicesImage.Key);
        var reused = await CreatePostAsync(alice, alicesImage.Key);

        stolen.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await stolen.ProblemCodeAsync(Ct)).Should().Be("INVALID_IMAGE");
        (await missing.ProblemCodeAsync(Ct)).Should().Be("INVALID_IMAGE");
        first.StatusCode.Should().Be(HttpStatusCode.Created);
        reused.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await reused.ProblemCodeAsync(Ct)).Should().Be("IMAGE_ALREADY_USED");
    }

    [Fact]
    public async Task Deleting_a_post_deletes_its_image()
    {
        var (author, _) = await factory.SignedInClientAsync(Ct);
        var image = await UploadAsync(author);
        var post = await (await CreatePostAsync(author, image.Key)).ReadAsync<PostResponse>(Ct);

        await author.DeleteAsync($"/api/v1/posts/{post.Id}", Ct);

        (await factory.CreateClient().GetAsync(image.Url, Ct)).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Theory]
    [InlineData("/files/avatars/1/not-a-key.png")]
    [InlineData("/files/..%2F..%2Fappsettings.json")]
    [InlineData("/files/images/1/0123456789abcdef0123456789abcdef.png")]
    public async Task Unknown_or_malformed_file_paths_are_404s(string path)
    {
        var response = await factory.CreateClient().GetAsync(path, Ct);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await response.ProblemCodeAsync(Ct)).Should().Be("FILE_NOT_FOUND");
    }

    [Fact]
    public async Task Uploads_are_limited_per_member_not_per_address()
    {
        using var api = factory.WithWebHostBuilder(builder =>
            builder.UseSetting($"{RateLimitOptions.SectionName}:{nameof(RateLimitOptions.UploadsPerHour)}", "2"));
        var (first, _) = await api.SignedInClientAsync(Ct);
        var (second, _) = await api.SignedInClientAsync(Ct);

        var statuses = new List<HttpStatusCode>();
        for (var attempt = 0; attempt < 3; attempt++)
        {
            statuses.Add((await first.PostAsync(ImagesPath, ImageForm(Png), Ct)).StatusCode);
        }

        var otherMember = await second.PostAsync(ImagesPath, ImageForm(Png), Ct);

        statuses.Should().Equal(HttpStatusCode.Created, HttpStatusCode.Created, HttpStatusCode.TooManyRequests);
        otherMember.StatusCode.Should().Be(HttpStatusCode.Created, "the same address, but a different member");
    }

    private static MultipartFormDataContent ImageForm(byte[] bytes, string fileName = "image.png")
    {
        var file = new ByteArrayContent(bytes);
        file.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        return new MultipartFormDataContent { { file, "file", fileName } };
    }

    private static async Task<UploadedImage> UploadAsync(HttpClient client)
    {
        var response = await client.PostAsync(ImagesPath, ImageForm(Png), Ct);
        response.EnsureSuccessStatusCode();
        return await response.ReadAsync<UploadedImage>(Ct);
    }

    private static Task<HttpResponseMessage> CreatePostAsync(HttpClient author, string imageKey) =>
        author.PostJsonAsync(
            "/api/v1/posts",
            new CreatePostRequest { Kind = SparkKind.Photography, Body = "Look at this", ImageKey = imageKey },
            Ct);
}
