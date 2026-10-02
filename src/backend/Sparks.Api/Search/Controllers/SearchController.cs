using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sparks.Api.Auth.Services;
using Sparks.Api.Posts.Services;
using Sparks.Api.Search.Models;
using Sparks.Api.Users.Services;

namespace Sparks.Api.Search.Controllers;

/// <summary>
/// Search across sparks and members. The results themselves come from the
/// post feed and member search; this tells the tabs how many each finds.
/// </summary>
[ApiController]
[Route("api/v1/search")]
public sealed class SearchController(PostService posts, UserService users) : ControllerBase
{
    /// <summary>How many sparks and members a search finds, for the counts on its tabs.</summary>
    [HttpGet("counts")]
    [AllowAnonymous]
    public async Task<SearchCounts> GetCounts([FromQuery] SearchCountsQuery query, CancellationToken ct) =>
        new(
            await posts.CountMatchingAsync(query.Q, ct),
            await users.CountMatchingAsync(query.Q, User.FindUserId(), ct));
}
