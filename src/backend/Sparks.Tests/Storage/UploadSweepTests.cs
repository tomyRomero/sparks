using System.Net;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Sparks.Api.Posts.Data;
using Sparks.Api.Posts.Models;
using Sparks.Api.Storage;
using Sparks.Api.Storage.Models;
using Sparks.Api.Storage.Services;
using Sparks.Tests.Infrastructure;

namespace Sparks.Tests.Storage;

public sealed class UploadSweepTests(SparksApiFactory factory)
{
    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task A_day_later_unused_uploads_are_deleted_and_used_ones_stay()
    {
        // A folder of its own, so the sweep can't touch other tests' uploads.
        var root = Path.Combine(Path.GetTempPath(), $"sparks-sweep-{Guid.NewGuid():N}");
        try
        {
            await using var api = factory.WithWebHostBuilder(builder =>
                builder.UseSetting($"{StorageOptions.SectionName}:{nameof(StorageOptions.LocalRoot)}", root));
            var (member, _) = await api.SignedInClientAsync(Ct);
            var unused = await UploadAsync(member);
            var attached = await UploadAsync(member);
            var recent = await UploadAsync(member);
            var post = await member.PostJsonAsync(
                "/api/v1/posts",
                new CreatePostRequest { Kind = SparkKind.Photography, Body = "Kept", ImageKey = attached.Key },
                Ct);
            post.EnsureSuccessStatusCode();
            foreach (var image in new[] { unused, attached })
            {
                File.SetLastWriteTimeUtc(Path.Combine(root, image.Key), DateTime.UtcNow.AddHours(-25));
            }

            await using (var scope = api.Services.CreateAsyncScope())
            {
                await scope.ServiceProvider.GetRequiredService<UploadSweep>().SweepAsync(Ct);
            }

            var reader = api.CreateClient();
            (await reader.GetAsync(unused.Url, Ct)).StatusCode.Should().Be(HttpStatusCode.NotFound);
            (await reader.GetAsync(attached.Url, Ct)).StatusCode.Should().Be(HttpStatusCode.OK);
            (await reader.GetAsync(recent.Url, Ct)).StatusCode.Should().Be(HttpStatusCode.OK);
        }
        finally
        {
            if (Directory.Exists(root))
            {
                Directory.Delete(root, recursive: true);
            }
        }
    }

    private static async Task<UploadedImage> UploadAsync(HttpClient client)
    {
        var response = await client.PostAsync("/api/v1/images", ContentHelpers.PngForm(), Ct);
        response.EnsureSuccessStatusCode();
        return await response.ReadAsync<UploadedImage>(Ct);
    }
}
