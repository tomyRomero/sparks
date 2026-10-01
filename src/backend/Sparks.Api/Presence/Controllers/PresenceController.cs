using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Sparks.Api.Auth.Services;
using Sparks.Api.Presence.Models;
using Sparks.Api.Presence.Services;

namespace Sparks.Api.Presence.Controllers;

/// <summary>
/// Who's online, for signed-in members. Changes after the first answer
/// arrive over the live connection as <c>PresenceChanged</c>.
/// </summary>
[ApiController]
[Route("api/v1/presence")]
public sealed class PresenceController(PresenceService presence) : ControllerBase
{
    private const int MaxIds = 100;

    /// <summary>Whether each member is online, and when they last were (<c>?ids=1&amp;ids=2</c>).</summary>
    [HttpGet]
    public Task<IReadOnlyList<PresenceResponse>> Get(
        [FromQuery(Name = "ids"), Required, MinLength(1, ErrorMessage = "Ask about at least one member."),
         MaxLength(MaxIds, ErrorMessage = "Ask about at most 100 members at a time.")]
        long[] ids,
        CancellationToken ct) =>
        presence.GetAsync(ids, ct);

    /// <summary>A few members who are around: online now, then the most recently seen.</summary>
    [HttpGet("around")]
    public Task<IReadOnlyList<MemberPresenceResponse>> GetAround(
        [FromQuery(Name = "limit"), Range(1, 20)] int limit = 5,
        CancellationToken ct = default) =>
        presence.GetAroundAsync(User.GetUserId(), limit, ct);
}
