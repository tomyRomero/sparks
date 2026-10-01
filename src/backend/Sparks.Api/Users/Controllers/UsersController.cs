using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Sparks.Api.Auth.Services;
using Sparks.Api.Common.Models;
using Sparks.Api.Common.Security;
using Sparks.Api.Posts.Models;
using Sparks.Api.Posts.Services;
using Sparks.Api.Storage;
using Sparks.Api.Users.Models;
using Sparks.Api.Users.Services;

namespace Sparks.Api.Users.Controllers;

/// <summary>
/// Members: finding them, their profile pages and the lists on them (posts,
/// comments, liked posts, followers and following), following them, and
/// editing your own profile. Reading is public; the rest needs a signed-in user.
/// </summary>
[ApiController]
[Route("api/v1/users")]
public sealed class UsersController(UserService users, FollowService follows, PostService posts, CommentService comments)
    : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public Task<CursorPage<UserSummary>> Search([FromQuery] UserSearchQuery query, CancellationToken ct) =>
        users.SearchAsync(query, User.FindUserId(), ct);

    [HttpGet("{username}")]
    [AllowAnonymous]
    public Task<ProfileResponse> GetProfile(string username, CancellationToken ct) =>
        users.GetProfileAsync(username, User.FindUserId(), ct);

    [HttpGet("{username}/posts")]
    [AllowAnonymous]
    public async Task<CursorPage<PostResponse>> GetPosts(string username, [FromQuery] UserPostsQuery query, CancellationToken ct)
    {
        var authorId = await users.GetIdAsync(username, ct);
        return await posts.GetByAuthorAsync(authorId, query, query.Pictures, User.FindUserId(), ct);
    }

    [HttpGet("{username}/comments")]
    [AllowAnonymous]
    public async Task<CursorPage<CommentResponse>> GetComments(string username, [FromQuery] PageRequest page, CancellationToken ct)
    {
        var authorId = await users.GetIdAsync(username, ct);
        return await comments.GetByAuthorAsync(authorId, page, User.FindUserId(), ct);
    }

    /// <summary>The posts this member liked, newest post first.</summary>
    [HttpGet("{username}/liked")]
    [AllowAnonymous]
    public async Task<CursorPage<PostResponse>> GetLiked(string username, [FromQuery] PageRequest page, CancellationToken ct)
    {
        var userId = await users.GetIdAsync(username, ct);
        return await posts.GetLikedByAsync(userId, page, User.FindUserId(), ct);
    }

    [HttpGet("{username}/followers")]
    [AllowAnonymous]
    public Task<OpaqueCursorPage<MemberResponse>> GetFollowers(
        string username, [FromQuery] OpaquePageRequest page, CancellationToken ct) =>
        follows.GetFollowersAsync(username, page, User.FindUserId(), ct);

    [HttpGet("{username}/following")]
    [AllowAnonymous]
    public Task<OpaqueCursorPage<MemberResponse>> GetFollowing(
        string username, [FromQuery] OpaquePageRequest page, CancellationToken ct) =>
        follows.GetFollowingAsync(username, page, User.FindUserId(), ct);

    [HttpPut("{username}/follow")]
    public Task<FollowState> Follow(string username, CancellationToken ct) =>
        follows.FollowAsync(User.GetUserId(), username, ct);

    [HttpDelete("{username}/follow")]
    public Task<FollowState> Unfollow(string username, CancellationToken ct) =>
        follows.UnfollowAsync(User.GetUserId(), username, ct);

    /// <summary>Members the signed-in user might follow, for an empty Following feed.</summary>
    [HttpGet("me/suggestions")]
    public Task<IReadOnlyList<MemberResponse>> GetSuggestions([FromQuery] SuggestionsQuery query, CancellationToken ct) =>
        follows.SuggestAsync(User.GetUserId(), query.Limit, ct);

    [HttpPatch("me")]
    public Task<ProfileResponse> UpdateProfile(UpdateProfileRequest request, CancellationToken ct) =>
        users.UpdateProfileAsync(User.GetUserId(), request, ct);

    /// <summary>Sets the profile picture from an uploaded image (multipart field <c>file</c>).</summary>
    [HttpPut("me/avatar")]
    [RequestSizeLimit(ImageUploadService.MaxRequestBytes)]
    [EnableRateLimiting(RateLimitPolicies.Uploads)]
    public Task<ProfileResponse> SetAvatar(IFormFile file, CancellationToken ct) =>
        users.SetAvatarAsync(User.GetUserId(), file, ct);

    [HttpDelete("me/avatar")]
    public Task<ProfileResponse> RemoveAvatar(CancellationToken ct) =>
        users.RemoveAvatarAsync(User.GetUserId(), ct);
}
