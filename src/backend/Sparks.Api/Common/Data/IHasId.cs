namespace Sparks.Api.Common.Data;

/// <summary>
/// A row keyed by a <c>bigint</c> identity. Ids grow with each insert, so
/// ordering by id orders by creation, which cursor paging relies on.
/// </summary>
public interface IHasId
{
    long Id { get; }
}
