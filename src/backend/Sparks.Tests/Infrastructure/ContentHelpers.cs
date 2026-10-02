using System.Net.Http.Headers;
using Sparks.Api.Posts.Data;
using Sparks.Api.Posts.Models;
using Sparks.Api.Storage.Models;

namespace Sparks.Tests.Infrastructure;

/// <summary>Posts and comments written through the API, for tests that need some to exist.</summary>
internal static class ContentHelpers
{
    public static Task<PostResponse> CreatePostAsync(this HttpClient author, string body, CancellationToken ct) =>
        author.CreatePostAsync(body, SparkKind.Regular, ct);

    public static async Task<PostResponse> CreatePostAsync(
        this HttpClient author, string body, SparkKind kind, CancellationToken ct)
    {
        var response = await author.PostJsonAsync("/api/v1/posts", new CreatePostRequest { Kind = kind, Body = body }, ct);
        response.EnsureSuccessStatusCode();
        return await response.ReadAsync<PostResponse>(ct);
    }

    /// <summary>Uploads a picture and shares a post with it.</summary>
    public static async Task<PostResponse> CreatePictureAsync(
        this HttpClient author, string body, SparkKind kind, CancellationToken ct)
    {
        var upload = await author.PostAsync("/api/v1/images", PngForm(), ct);
        upload.EnsureSuccessStatusCode();
        var image = await upload.ReadAsync<UploadedImage>(ct);
        var response = await author.PostJsonAsync(
            "/api/v1/posts", new CreatePostRequest { Kind = kind, Body = body, ImageKey = image.Key }, ct);
        response.EnsureSuccessStatusCode();
        return await response.ReadAsync<PostResponse>(ct);
    }

    /// <summary>A real 1x1 PNG, as an upload form.</summary>
    public static MultipartFormDataContent PngForm()
    {
        var file = new ByteArrayContent(Convert.FromBase64String(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="));
        file.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        return new MultipartFormDataContent { { file, "file", "image.png" } };
    }

    public static async Task<CommentResponse> CommentAsync(
        this HttpClient author, long postId, string body, CancellationToken ct)
    {
        var response = await author.PostJsonAsync($"/api/v1/posts/{postId}/comments", new CommentRequest { Body = body }, ct);
        response.EnsureSuccessStatusCode();
        return await response.ReadAsync<CommentResponse>(ct);
    }

    public static async Task<CommentResponse> ReplyAsync(
        this HttpClient author, long commentId, string body, CancellationToken ct)
    {
        var response = await author.PostJsonAsync($"/api/v1/comments/{commentId}/replies", new CommentRequest { Body = body }, ct);
        response.EnsureSuccessStatusCode();
        return await response.ReadAsync<CommentResponse>(ct);
    }
}
