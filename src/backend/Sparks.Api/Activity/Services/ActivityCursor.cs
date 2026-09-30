using System.Buffers.Text;
using System.Globalization;
using System.Text;

namespace Sparks.Api.Activity.Services;

/// <summary>
/// Where a page of activity ended. Activity mixes rows from several tables,
/// so no single id orders it; the cursor carries the whole sort key instead,
/// encoded so clients treat it as opaque.
/// </summary>
internal sealed record ActivityCursor(DateTime At, int Kind, long SubjectId, long ActorId)
{
    public static ActivityCursor After(ActivityRow row) => new(row.At, row.Kind, row.SubjectId, row.ActorId);

    public string Encode() =>
        Base64Url.EncodeToString(Encoding.UTF8.GetBytes(
            string.Create(CultureInfo.InvariantCulture, $"{At.Ticks}.{Kind}.{SubjectId}.{ActorId}")));

    /// <summary>Reads a cursor this API gave out; null for anything else.</summary>
    public static ActivityCursor? Parse(string value)
    {
        byte[] bytes;
        try
        {
            bytes = Base64Url.DecodeFromChars(value);
        }
        catch (FormatException)
        {
            return null;
        }

        var parts = Encoding.UTF8.GetString(bytes).Split('.');
        return parts.Length == 4
            && long.TryParse(parts[0], NumberStyles.None, CultureInfo.InvariantCulture, out var ticks)
            && ticks <= DateTime.MaxValue.Ticks
            && int.TryParse(parts[1], NumberStyles.None, CultureInfo.InvariantCulture, out var kind)
            && long.TryParse(parts[2], NumberStyles.None, CultureInfo.InvariantCulture, out var subjectId)
            && long.TryParse(parts[3], NumberStyles.None, CultureInfo.InvariantCulture, out var actorId)
                ? new ActivityCursor(new DateTime(ticks, DateTimeKind.Utc), kind, subjectId, actorId)
                : null;
    }
}
