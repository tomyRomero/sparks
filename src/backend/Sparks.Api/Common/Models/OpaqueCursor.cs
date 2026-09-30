using System.Buffers.Text;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Text;

namespace Sparks.Api.Common.Models;

/// <summary>
/// Cursors for lists that no single id orders, such as activity and the
/// inbox. The cursor carries the whole sort key, base64url-encoded so
/// clients treat it as opaque rather than building their own.
/// </summary>
public static class OpaqueCursor
{
    public static string Encode(params ReadOnlySpan<long> parts)
    {
        var text = new StringBuilder();
        foreach (var part in parts)
        {
            if (text.Length > 0)
            {
                text.Append('.');
            }

            text.Append(part.ToString(CultureInfo.InvariantCulture));
        }

        return Base64Url.EncodeToString(Encoding.ASCII.GetBytes(text.ToString()));
    }

    /// <summary>
    /// The parts of a cursor this API gave out, or null for anything else:
    /// bad encoding, the wrong number of parts, or a negative number.
    /// </summary>
    public static long[]? Decode(string cursor, int partCount)
    {
        byte[] bytes;
        try
        {
            bytes = Base64Url.DecodeFromChars(cursor);
        }
        catch (FormatException)
        {
            return null;
        }

        var texts = Encoding.ASCII.GetString(bytes).Split('.');
        if (texts.Length != partCount)
        {
            return null;
        }

        var parts = new long[partCount];
        for (var i = 0; i < partCount; i++)
        {
            if (!long.TryParse(texts[i], NumberStyles.None, CultureInfo.InvariantCulture, out parts[i]))
            {
                return null;
            }
        }

        return parts;
    }
}

/// <summary>Paging for lists with an <see cref="OpaqueCursor"/>.</summary>
public record OpaquePageRequest
{
    /// <summary>The <see cref="OpaqueCursorPage{T}.NextCursor"/> of the previous page; omit for the first page.</summary>
    [StringLength(200)]
    public string? Cursor { get; init; }

    [Range(1, PageRequest.MaxLimit)]
    public int Limit { get; init; } = PageRequest.DefaultLimit;
}

/// <summary>One page of a list with an <see cref="OpaqueCursor"/>.</summary>
/// <param name="NextCursor">Pass as <c>cursor</c> for the next page; null on the last page.</param>
public sealed record OpaqueCursorPage<T>(IReadOnlyList<T> Items, string? NextCursor);
