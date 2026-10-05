using System.ComponentModel.DataAnnotations;
using Sparks.Api.Common.Constants;

namespace Sparks.Api.Search.Models;

public sealed record SearchCountsQuery
{
    [Required, StringLength(InputLimits.SearchMaxLength, MinimumLength = 1)]
    public string Q { get; init; } = string.Empty;
}

public sealed record SearchCounts(int Sparks, int Members);
