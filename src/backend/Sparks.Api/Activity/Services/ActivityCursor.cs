using Sparks.Api.Common.Models;

namespace Sparks.Api.Activity.Services;

/// <summary>
/// Where a page of activity ended. Activity mixes rows from several tables,
/// so no single id orders it; the cursor carries the whole sort key.
/// </summary>
internal sealed record ActivityCursor(DateTime At, int Kind, long SubjectId, long ActorId)
{
    public static ActivityCursor After(ActivityRow row) => new(row.At, row.Kind, row.SubjectId, row.ActorId);

    public string Encode() => OpaqueCursor.Encode(At.Ticks, Kind, SubjectId, ActorId);

    /// <summary>Reads a cursor this API gave out; null for anything else.</summary>
    public static ActivityCursor? Parse(string value) =>
        OpaqueCursor.Decode(value, partCount: 4) is [var ticks, var kind, var subjectId, var actorId]
        && ticks <= DateTime.MaxValue.Ticks
        && kind <= int.MaxValue
            ? new ActivityCursor(new DateTime(ticks, DateTimeKind.Utc), (int)kind, subjectId, actorId)
            : null;
}
