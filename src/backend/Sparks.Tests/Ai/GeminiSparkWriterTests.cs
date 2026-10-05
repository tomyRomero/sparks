using System.Net;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Sparks.Api.Ai;
using Sparks.Api.Ai.Providers;
using Sparks.Api.Ai.Services;
using Sparks.Api.Common.Errors;
using Sparks.Api.Posts.Data;
using Sparks.Tests.Infrastructure;

namespace Sparks.Tests.Ai;

/// <summary>What the Gemini writer sends, and how it reads every kind of answer. No network involved.</summary>
public sealed class GeminiSparkWriterTests
{
    private readonly string _apiKey = $"key-{Guid.NewGuid():N}";

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task It_sends_the_kinds_brief_and_asks_for_json_with_the_key_in_a_header()
    {
        var handler = new StubHttpHandler(HttpStatusCode.OK, Reply("""{"body":"Title: Tide","imagePrompt":"A lighthouse at night."}"""));

        var draft = await Writer(handler).DraftAsync(SparkKind.MovieScript, "A keeper hears a ghost", Ct);

        draft.Should().Be(new SparkDraft("Title: Tide", "A lighthouse at night."));
        handler.Request!.RequestUri!.ToString().Should().Be(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent",
            "the key goes in a header, never the URL, so it can't end up in logs");
        handler.Request.Headers.GetValues("x-goog-api-key").Should().Equal(_apiKey);

        var body = JsonDocument.Parse(handler.RequestBody!).RootElement;
        body.GetProperty("contents")[0].GetProperty("parts")[0].GetProperty("text").GetString().Should().Be("A keeper hears a ghost");
        body.GetProperty("systemInstruction").GetProperty("parts")[0].GetProperty("text").GetString()
            .Should().Contain("movie synopsis").And.Contain("imagePrompt");
        var config = body.GetProperty("generationConfig");
        config.GetProperty("responseMimeType").GetString().Should().Be("application/json");
        config.GetProperty("responseSchema").GetProperty("required").EnumerateArray().Select(field => field.GetString())
            .Should().Equal("body", "imagePrompt");
    }

    [Fact]
    public async Task Text_only_kinds_get_no_image_prompt()
    {
        var handler = new StubHttpHandler(HttpStatusCode.OK, Reply("""{"body":"Rain on the window","imagePrompt":"unasked"}"""));

        var draft = await Writer(handler).DraftAsync(SparkKind.Haiku, "rain", Ct);

        draft.ImagePrompt.Should().BeNull();
        JsonDocument.Parse(handler.RequestBody!).RootElement
            .GetProperty("generationConfig").GetProperty("responseSchema").GetProperty("required")
            .EnumerateArray().Select(field => field.GetString()).Should().Equal("body");
    }

    [Theory]
    [InlineData("""{"promptFeedback":{"blockReason":"SAFETY"}}""")]
    [InlineData("""{"candidates":[{"finishReason":"SAFETY"}]}""")]
    public async Task A_prompt_the_safety_filters_block_is_declined(string reply)
    {
        var draft = () => Writer(new StubHttpHandler(HttpStatusCode.OK, reply)).DraftAsync(SparkKind.Joke, "something", Ct);

        var error = (await draft.Should().ThrowAsync<ApiException>()).Which;
        error.StatusCode.Should().Be(StatusCodes.Status422UnprocessableEntity);
        error.Code.Should().Be("PROMPT_DECLINED");
    }

    [Theory]
    [InlineData(HttpStatusCode.InternalServerError, "{}")]
    [InlineData(HttpStatusCode.OK, "not json")]
    [InlineData(HttpStatusCode.OK, """{"candidates":[{"content":{"parts":[{"text":"not the json asked for"}]}}]}""")]
    [InlineData(HttpStatusCode.OK, """{"candidates":[]}""")]
    public async Task A_failed_or_unreadable_answer_means_the_ai_is_unavailable(HttpStatusCode status, string reply)
    {
        var draft = () => Writer(new StubHttpHandler(status, reply)).DraftAsync(SparkKind.Quote, "something", Ct);

        var error = (await draft.Should().ThrowAsync<ApiException>()).Which;
        error.StatusCode.Should().Be(StatusCodes.Status503ServiceUnavailable);
        error.Code.Should().Be("AI_UNAVAILABLE");
    }

    private GeminiSparkWriter Writer(StubHttpHandler handler) => new(
        handler.Client(GeminiSparkWriter.BaseAddress),
        Options.Create(new GeminiOptions { ApiKey = _apiKey, Model = "gemini-test" }),
        NullLogger<GeminiSparkWriter>.Instance);

    /// <summary>A successful Gemini answer whose text is <paramref name="json"/>.</summary>
    private static string Reply(string json) => JsonSerializer.Serialize(new
    {
        candidates = new[] { new { content = new { parts = new[] { new { text = json } } }, finishReason = "STOP" } },
    });
}
