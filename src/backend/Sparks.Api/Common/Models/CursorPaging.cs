using Sparks.Api.Common.Data;

namespace Sparks.Api.Common.Models;

/// <summary>
/// The query half of cursor paging: the rows after the cursor, in id order,
/// plus one extra row that tells <see cref="CursorPage.From"/> whether
/// another page exists.
/// </summary>
public static class CursorPaging
{
    /// <summary>Highest id first: feeds and profile lists.</summary>
    public static IQueryable<T> NewestFirst<T>(this IQueryable<T> rows, PageRequest page)
        where T : class, IHasId
    {
        if (page.Cursor is { } cursor)
        {
            rows = rows.Where(row => row.Id < cursor);
        }

        return rows.OrderByDescending(row => row.Id).Take(page.Limit + 1);
    }

    /// <summary>Lowest id first: threads, where each reply follows what it answers.</summary>
    public static IQueryable<T> OldestFirst<T>(this IQueryable<T> rows, PageRequest page)
        where T : class, IHasId
    {
        if (page.Cursor is { } cursor)
        {
            rows = rows.Where(row => row.Id > cursor);
        }

        return rows.OrderBy(row => row.Id).Take(page.Limit + 1);
    }
}
