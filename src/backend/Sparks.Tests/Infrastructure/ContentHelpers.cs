using Sparks.Api.Posts.Data;
using Sparks.Api.Posts.Models;

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
