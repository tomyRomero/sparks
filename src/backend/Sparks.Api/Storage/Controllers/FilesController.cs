using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sparks.Api.Storage.Services;

namespace Sparks.Api.Storage.Controllers;

/// <summary>
/// Serves stored images. They're public, as the posts and profiles showing
/// them are, and a key's content never changes, so browsers may cache them
/// for good.
/// </summary>
[ApiController]
[Route(FileUrls.RoutePrefix)]
[AllowAnonymous]
public sealed class FilesController(IFileStorage storage) : ControllerBase
{
    [HttpGet("{**key}")]
    public async Task<IActionResult> Get(string key, CancellationToken ct)
    {
        if (!StorageKeys.IsValid(key) || await storage.OpenReadAsync(key, ct) is not { } content)
        {
            throw StorageErrors.FileNotFound();
        }

        Response.Headers.CacheControl = "public, max-age=31536000, immutable";
        return File(content, StorageKeys.ContentType(key));
    }
}
