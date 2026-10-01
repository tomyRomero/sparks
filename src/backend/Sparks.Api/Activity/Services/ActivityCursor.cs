using Sparks.Api.Common.Models;

namespace Sparks.Api.Activity.Services;

/// <summary>
/// Where a page of activity ended. Activity mixes rows from several tables,
/// so no single id orders it; the cursor carries the whole sort key.
/// </summary>
internal sealed record ActivityCursor(DateTime At, int Kind, long SubjectId)
{
    public static ActivityCursor After(ActivityGroup group) => new(group.At, group.Kind, group.SubjectId);

    public string Encode() => OpaqueCursor.Encode(At.Ticks, Kind, SubjectId);

    /// <summary>Reads a cursor this API gave out; null for anything else.</summary>
    public static ActivityCursor? Parse(string value) =>
        OpaqueCursor.Decode(value, partCount: 3) is [var ticks, var kind, var subjectId]
        && ticks <= DateTime.MaxValue.Ticks
        && kind <= int.MaxValue
            ? new ActivityCursor(new DateTime(ticks, DateTimeKind.Utc), (int)kind, subjectId)
            : null;
}
