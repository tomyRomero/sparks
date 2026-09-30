using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Sparks.Api.Common.Data;

/// <summary>
/// Every timestamp in Sparks is UTC. SQL Server's <c>datetime2</c> stores no
/// time zone, so values read back with an unspecified kind; this marks them UTC
/// again, which keeps comparisons correct and makes JSON carry a trailing Z.
/// </summary>
public sealed class UtcDateTimeConverter() : ValueConverter<DateTime, DateTime>(
    value => value.Kind == DateTimeKind.Local ? value.ToUniversalTime() : value,
    value => DateTime.SpecifyKind(value, DateTimeKind.Utc));
