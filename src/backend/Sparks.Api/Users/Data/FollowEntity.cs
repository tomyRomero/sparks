namespace Sparks.Api.Users.Data;

/// <summary>One member following another (table <c>follows</c>).</summary>
public class FollowEntity
{
    public long FollowerId { get; set; }
    public UserEntity Follower { get; set; } = null!;

    /// <summary>The member being followed.</summary>
    public long FolloweeId { get; set; }
    public UserEntity Followee { get; set; } = null!;

    public DateTime CreatedAt { get; set; }
}
