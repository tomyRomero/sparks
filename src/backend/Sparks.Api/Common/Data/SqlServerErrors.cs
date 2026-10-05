using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Sparks.Api.Common.Data;

/// <summary>The SQL Server errors services turn into answers instead of failures.</summary>
internal static class SqlServerErrors
{
    /// <summary>The write broke a unique index (2601) or a primary key or unique constraint (2627).</summary>
    public static bool IsUniqueViolation(this DbUpdateException ex) =>
        ex.InnerException is SqlException { Number: 2601 or 2627 };

    /// <summary>
    /// The write broke a foreign key or check constraint (547). On a table
    /// without check constraints, it means a row it points at was just deleted.
    /// </summary>
    public static bool IsForeignKeyViolation(this DbUpdateException ex) =>
        ex.InnerException is SqlException { Number: 547 };
}
