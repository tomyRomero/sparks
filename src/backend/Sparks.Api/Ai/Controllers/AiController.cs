using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Sparks.Api.Ai.Models;
using Sparks.Api.Ai.Services;
using Sparks.Api.Auth.Services;
using Sparks.Api.Common.Security;
using Sparks.Api.Storage;

namespace Sparks.Api.Ai.Controllers;

/// <summary>AI drafts and pictures for signed-in members, limited per member per hour.</summary>
[ApiController]
[Route("api/v1/ai")]
[EnableRateLimiting(RateLimitPolicies.Ai)]
public sealed class AiController(AiService ai) : ControllerBase
{
    /// <summary>A draft of a spark of the given kind, from the member's idea.</summary>
    [HttpPost("drafts")]
    public Task<DraftResponse> Draft(DraftRequest request, CancellationToken ct) =>
        ai.DraftAsync(request.Kind!.Value, request.Prompt, ct);

    /// <summary>Paints a picture and stores it, returning the key to attach it to a post by.</summary>
    [HttpPost("images")]
    [ProducesResponseType<UploadedImage>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Paint(ImageRequest request, CancellationToken ct)
    {
        var image = await ai.PaintAsync(User.GetUserId(), request.Prompt, ct);
        return Created(image.Url, image);
    }
}
