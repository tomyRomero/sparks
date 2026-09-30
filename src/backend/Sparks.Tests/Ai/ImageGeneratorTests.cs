using System.Buffers.Binary;
using System.Net;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Sparks.Api.Ai;
using Sparks.Api.Ai.Providers;
using Sparks.Api.Common.Errors;
using Sparks.Api.Storage;
using Sparks.Tests.Infrastructure;

namespace Sparks.Tests.Ai;

/// <summary>The Cloudflare client against a stub, and the sample painter. No network involved.</summary>
public sealed class ImageGeneratorTests
{
    private readonly string _apiToken = $"token-{Guid.NewGuid():N}";

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Cloudflare_gets_the_prompt_with_a_bearer_token_and_its_image_is_decoded()
    {
        var png = await new SampleImageGenerator().GenerateAsync("anything", Ct);
        var handler = new StubHttpHandler(HttpStatusCode.OK, Result(Convert.ToBase64String(png)));

        var image = await Cloudflare(handler).GenerateAsync("A lighthouse at night", Ct);

        image.Should().Equal(png);
        handler.Request!.RequestUri!.ToString().Should().Be(
            "https://api.cloudflare.com/client/v4/accounts/account-1/ai/run/@cf/test/model");
        handler.Request.Headers.Authorization!.ToString().Should().Be($"Bearer {_apiToken}");
        JsonDocument.Parse(handler.RequestBody!).RootElement.GetProperty("prompt").GetString().Should().Be("A lighthouse at night");
    }

    [Fact]
    public async Task A_prompt_cloudflare_flags_is_declined()
    {
        var handler = new StubHttpHandler(
            HttpStatusCode.BadRequest, """{"success":false,"errors":[{"code":3030,"message":"NSFW content detected"}]}""");

        var generate = () => Cloudflare(handler).GenerateAsync("something", Ct);

        (await generate.Should().ThrowAsync<ApiException>()).Which.Code.Should().Be("PROMPT_DECLINED");
    }

    [Theory]
    [InlineData(HttpStatusCode.InternalServerError, """{"success":false}""")]
    [InlineData(HttpStatusCode.OK, """{"success":true,"result":{}}""")]
    [InlineData(HttpStatusCode.OK, """{"success":true,"result":{"image":"bm90IGFuIGltYWdl"}}""")]
    public async Task A_failed_or_unusable_answer_means_the_ai_is_unavailable(HttpStatusCode status, string reply)
    {
        var generate = () => Cloudflare(new StubHttpHandler(status, reply)).GenerateAsync("something", Ct);

        var error = (await generate.Should().ThrowAsync<ApiException>()).Which;
        error.StatusCode.Should().Be(StatusCodes.Status503ServiceUnavailable);
        error.Code.Should().Be("AI_UNAVAILABLE");
    }

    [Fact]
    public async Task The_sample_painter_makes_a_512_pixel_png_that_depends_on_the_prompt()
    {
        var painter = new SampleImageGenerator();

        var first = await painter.GenerateAsync("a red sunset", Ct);
        var again = await painter.GenerateAsync("a red sunset", Ct);
        var other = await painter.GenerateAsync("a green forest", Ct);

        ImageFormats.Detect(first).Should().Be(ImageFormat.Png);
        // The IHDR chunk starts right after the 8-byte signature and 8 bytes of length and type.
        BinaryPrimitives.ReadInt32BigEndian(first.AsSpan(16)).Should().Be(512);
        BinaryPrimitives.ReadInt32BigEndian(first.AsSpan(20)).Should().Be(512);
        again.Should().Equal(first);
        other.Should().NotEqual(first);
    }

    private CloudflareImageGenerator Cloudflare(StubHttpHandler handler) => new(
        handler.Client(CloudflareImageGenerator.BaseAddress),
        Options.Create(new CloudflareAiOptions { AccountId = "account-1", ApiToken = _apiToken, Model = "@cf/test/model" }),
        NullLogger<CloudflareImageGenerator>.Instance);

    private static string Result(string base64Image) =>
        JsonSerializer.Serialize(new { success = true, result = new { image = base64Image } });
}
