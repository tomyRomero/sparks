using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Sparks.Api.Auth.Services;
using Sparks.Api.Common.Security;
using Sparks.Api.Storage.Models;
using Sparks.Api.Storage.Services;

namespace Sparks.Api.Storage.Controllers;

/// <summary>Images for posts, stored first and attached when the post is written.</summary>
[ApiController]
[Route("api/v1/images")]
public sealed class ImagesController(ImageUploadService images) : ControllerBase
{
    /// <summary>Stores an image (multipart field <c>file</c>) and returns the key to attach it by.</summary>
    [HttpPost]
    [RequestSizeLimit(ImageUploadService.MaxRequestBytes)]
    [EnableRateLimiting(RateLimitPolicies.Uploads)]
    [ProducesResponseType<UploadedImage>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Upload(IFormFile file, CancellationToken ct)
    {
        var key = await images.SaveAsync(file, StorageKeys.Images, User.GetUserId(), ImageUploadService.MaxImageBytes, ct);
        var url = FileUrls.Of(key)!;
        return Created(url, new UploadedImage(key, url));
    }
}
