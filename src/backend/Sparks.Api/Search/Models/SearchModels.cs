using System.ComponentModel.DataAnnotations;
using Sparks.Api.Posts.Models;

namespace Sparks.Api.Search.Models;

public sealed record SearchCountsQuery
{
    [Required, StringLength(PostFilters.MaxQueryLength, MinimumLength = 1)]
    public string Q { get; init; } = string.Empty;
}

public sealed record SearchCounts(int Sparks, int Members);
