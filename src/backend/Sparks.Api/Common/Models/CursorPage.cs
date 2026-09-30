using System.ComponentModel.DataAnnotations;

namespace Sparks.Api.Common.Models;

/// <summary>
/// Paging for lists ordered by id: the feed newest first, a thread oldest
/// first. Instead of a page number, the client sends back the cursor from the
/// previous page, so items added in the meantime can't shift what it has
/// already seen.
/// </summary>
public record PageRequest
{
    public const int DefaultLimit = 20;
    public const int MaxLimit = 50;

    /// <summary>The <see cref="CursorPage{T}.NextCursor"/> of the previous page; omit for the first page.</summary>
    [Range(1, long.MaxValue)]
    public long? Cursor { get; init; }

    [Range(1, MaxLimit)]
    public int Limit { get; init; } = DefaultLimit;
}

/// <summary>One page of results, in the list's order.</summary>
/// <param name="NextCursor">Pass as <c>cursor</c> to get the next page; null on the last page.</param>
public sealed record CursorPage<T>(IReadOnlyList<T> Items, long? NextCursor);

public static class CursorPage
{
    /// <summary>
    /// Builds a page from a query that fetched one row more than the limit;
    /// the extra row only tells whether another page exists.
    /// </summary>
    public static CursorPage<T> From<T>(IReadOnlyList<T> fetched, int limit, Func<T, long> idOf)
    {
        if (fetched.Count <= limit)
        {
            return new CursorPage<T>(fetched, null);
        }

        var items = fetched.Take(limit).ToList();
        return new CursorPage<T>(items, idOf(items[^1]));
    }
}
