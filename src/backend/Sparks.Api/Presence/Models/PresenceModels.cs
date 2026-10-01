using Sparks.Api.Users.Models;

namespace Sparks.Api.Presence.Models;

/// <summary>Whether a member is online, and when they last were.</summary>
/// <param name="LastSeenAt">
/// When their last connection closed, or opened while they're online; null
/// if they've never connected.
/// </param>
public sealed record PresenceResponse(long UserId, bool Online, DateTime? LastSeenAt);

/// <summary>A member who's around, for the "who's around" list.</summary>
public sealed record MemberPresenceResponse(UserSummary User, bool Online, DateTime? LastSeenAt);
