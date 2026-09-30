using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sparks.Api.Auth.Services;
using Sparks.Api.Common.Models;
using Sparks.Api.Posts.Models;
using Sparks.Api.Posts.Services;

namespace Sparks.Api.Posts.Controllers;

/// <summary>
/// Sparks, and the comments made directly on them. Reading is open to
/// everyone; writing, editing, deleting and liking need a signed-in user, and
/// editing or deleting only the author.
/// </summary>
[ApiController]
[Route("api/v1/posts")]
public sealed class PostsController(PostService posts, CommentService comments) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public Task<CursorPage<PostResponse>> GetFeed([FromQuery] PostFeedQuery query, CancellationToken ct) =>
        posts.GetFeedAsync(query, User.FindUserId(), ct);

    [HttpGet("{id:long}")]
    [AllowAnonymous]
    public Task<PostResponse> Get(long id, CancellationToken ct) =>
        posts.GetAsync(id, User.FindUserId(), ct);

    [HttpPost]
    [ProducesResponseType<PostResponse>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create(CreatePostRequest request, CancellationToken ct)
    {
        var post = await posts.CreateAsync(User.GetUserId(), request, ct);
        return CreatedAtAction(nameof(Get), new { id = post.Id }, post);
    }

    [HttpPatch("{id:long}")]
    public Task<PostResponse> Update(long id, UpdatePostRequest request, CancellationToken ct) =>
        posts.UpdateAsync(id, User.GetUserId(), request, ct);

    [HttpDelete("{id:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(long id, CancellationToken ct)
    {
        await posts.DeleteAsync(id, User.GetUserId(), ct);
        return NoContent();
    }

    [HttpPut("{id:long}/like")]
    public Task<LikeState> Like(long id, CancellationToken ct) =>
        posts.LikeAsync(id, User.GetUserId(), ct);

    [HttpDelete("{id:long}/like")]
    public Task<LikeState> Unlike(long id, CancellationToken ct) =>
        posts.UnlikeAsync(id, User.GetUserId(), ct);

    [HttpGet("{id:long}/comments")]
    [AllowAnonymous]
    public Task<CursorPage<CommentResponse>> GetComments(long id, [FromQuery] PageRequest page, CancellationToken ct) =>
        comments.GetForPostAsync(id, page, User.FindUserId(), ct);

    [HttpPost("{id:long}/comments")]
    [ProducesResponseType<CommentResponse>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Comment(long id, CommentRequest request, CancellationToken ct)
    {
        var comment = await comments.CommentOnPostAsync(id, User.GetUserId(), request, ct);
        return CreatedAtAction(nameof(CommentsController.Get), "Comments", new { id = comment.Id }, comment);
    }
}
