using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sparks.Api.Auth.Services;
using Sparks.Api.Posts.Models;
using Sparks.Api.Posts.Services;
using Sparks.Api.Users.Services;

namespace Sparks.Api.Search;

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

public sealed record SearchCountsQuery
{
    [Required, StringLength(PostFilters.MaxQueryLength, MinimumLength = 1)]
    public string Q { get; init; } = string.Empty;
}

public sealed record SearchCounts(int Sparks, int Members);
