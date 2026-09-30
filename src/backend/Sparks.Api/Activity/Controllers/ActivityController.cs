using Microsoft.AspNetCore.Mvc;
using Sparks.Api.Activity.Models;
using Sparks.Api.Activity.Services;
using Sparks.Api.Auth.Services;
using Sparks.Api.Common.Models;

namespace Sparks.Api.Activity.Controllers;

/// <summary>The signed-in member's activity: what others did to their posts and comments.</summary>
[ApiController]
[Route("api/v1/activity")]
public sealed class ActivityController(ActivityService activity) : ControllerBase
{
    [HttpGet]
    public Task<OpaqueCursorPage<ActivityItem>> Get([FromQuery] OpaquePageRequest query, CancellationToken ct) =>
        activity.GetAsync(User.GetUserId(), query, ct);

    /// <summary>How many items are unread, for a badge.</summary>
    [HttpGet("unread-count")]
    public async Task<UnreadActivity> GetUnreadCount(CancellationToken ct) =>
        new(await activity.CountUnreadAsync(User.GetUserId(), ct));

    [HttpPost("read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarkRead(MarkActivityReadRequest request, CancellationToken ct)
    {
        await activity.MarkReadAsync(User.GetUserId(), request.UpTo!.Value, ct);
        return NoContent();
    }
}
