using System.Net;
using Amazon.S3;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Sparks.Api.Storage;
using Sparks.Tests.Infrastructure;

namespace Sparks.Tests.Storage;

/// <summary>Images in a bucket, against a real S3 API with signed requests.</summary>
public sealed class S3StorageTests : IClassFixture<S3Bucket>, IDisposable
{
    /// <summary>A real 1×1 PNG.</summary>
    private static readonly byte[] Png = Convert.FromBase64String(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");

    private readonly S3Bucket _bucket;
    private readonly IAmazonS3 _client;
    private readonly S3FileStorage _storage;

    public S3StorageTests(S3Bucket bucket)
    {
        _bucket = bucket;
        var settings = bucket.Settings();
        _client = S3FileStorage.CreateClient(settings);
        _storage = new S3FileStorage(_client, Options.Create(settings));
    }

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    private static string NewKey() => StorageKeys.New(StorageKeys.Images, 7, ImageFormat.Png);

    [Fact]
    public async Task A_saved_image_reads_back_byte_for_byte_with_its_content_type()
    {
        var key = NewKey();

        await _storage.SaveAsync(key, new MemoryStream(Png), Ct);

        (await _storage.ExistsAsync(key, Ct)).Should().BeTrue();
        await using (var content = await _storage.OpenReadAsync(key, Ct))
        {
            using var copy = new MemoryStream();
            await content!.CopyToAsync(copy, Ct);
            copy.ToArray().Should().Equal(Png);
        }

        var stored = await _client.GetObjectMetadataAsync(S3Bucket.Name, key, Ct);
        stored.Headers.ContentType.Should().Be("image/png");
    }

    [Fact]
    public async Task A_missing_image_reads_as_nothing()
    {
        var key = NewKey();

        (await _storage.ExistsAsync(key, Ct)).Should().BeFalse();
        (await _storage.OpenReadAsync(key, Ct)).Should().BeNull();
    }

    [Fact]
    public async Task Deleting_removes_an_image_and_deleting_it_again_is_harmless()
    {
        var key = NewKey();
        await _storage.SaveAsync(key, new MemoryStream(Png), Ct);

        await _storage.DeleteAsync(key, Ct);
        await _storage.DeleteAsync(key, Ct);

        (await _storage.ExistsAsync(key, Ct)).Should().BeFalse();
    }

    [Theory]
    [InlineData("../secrets.json")]
    [InlineData("images/7/not-random.png")]
    [InlineData("other/7/3f9c2a0b1d4e5f60718293a4b5c6d7e8.png")]
    public async Task Only_keys_storage_could_have_made_reach_the_bucket(string key)
    {
        var save = () => _storage.SaveAsync(key, new MemoryStream(Png), Ct);
        var read = () => _storage.OpenReadAsync(key, Ct);

        await save.Should().ThrowAsync<ArgumentException>();
        await read.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task The_bucket_refuses_a_wrong_secret()
    {
        var settings = _bucket.Settings(secretAccessKey: "not-the-secret");
        using var client = S3FileStorage.CreateClient(settings);
        var storage = new S3FileStorage(client, Options.Create(settings));

        var save = () => storage.SaveAsync(NewKey(), new MemoryStream(Png), Ct);

        (await save.Should().ThrowAsync<AmazonS3Exception>()).Which.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    public void Dispose() => _client.Dispose();
}
