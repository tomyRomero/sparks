namespace Sparks.Api.Users.Data;

/// <summary>A Sparks member's public profile (table <c>users</c>).</summary>
public class UserEntity
{
    public long Id { get; set; }

    /// <summary>Unique handle, compared without regard to case.</summary>
    public required string Username { get; set; }

    public required string DisplayName { get; set; }

    /// <summary>Sign-in address, compared without regard to case. Never shown publicly.</summary>
    public required string Email { get; set; }

    /// <summary>BCrypt hash of the password; the password itself is never stored.</summary>
    public required string PasswordHash { get; set; }

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
