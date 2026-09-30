namespace Sparks.Api.Users.Data;

/// <summary>A Sparks member's public profile (table <c>users</c>).</summary>
public class UserEntity
{
    public long Id { get; set; }

    /// <summary>Unique handle, compared without regard to case.</summary>
    public required string Username { get; set; }

    public required string DisplayName { get; set; }

    public string? Bio { get; set; }

    /// <summary>Storage key of the profile picture; the storage provider turns it into a URL.</summary>
    public string? AvatarKey { get; set; }

    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// When the user last opened their activity feed. Likes and comments on
    /// their posts after this moment count as unread.
    /// </summary>
    public DateTime? ActivityReadAt { get; set; }
}
