using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sparks.Api.Auth.Services;
using Sparks.Api.Common.Models;
using Sparks.Api.Posts.Models;
using Sparks.Api.Posts.Services;

namespace Sparks.Api.Posts.Controllers;

/// <summary>
/// A single comment and its replies. Comments directly on a post are listed
/// and written under <c>/posts/{id}/comments</c>. Reading is open to
/// everyone; the rest needs a signed-in user, and editing or deleting the author.
/// </summary>
[ApiController]
[Route("api/v1/comments")]
public sealed class CommentsController(CommentService comments) : ControllerBase
{
    [HttpGet("{id:long}")]
    [AllowAnonymous]
    public Task<CommentResponse> Get(long id, CancellationToken ct) =>
        comments.GetAsync(id, User.FindUserId(), ct);

    [HttpGet("{id:long}/replies")]
    [AllowAnonymous]
    public Task<CursorPage<CommentResponse>> GetReplies(long id, [FromQuery] PageRequest page, CancellationToken ct) =>
        comments.GetRepliesAsync(id, page, User.FindUserId(), ct);

    [HttpPost("{id:long}/replies")]
    [ProducesResponseType<CommentResponse>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Reply(long id, CommentRequest request, CancellationToken ct)
    {
        var reply = await comments.ReplyAsync(id, User.GetUserId(), request, ct);
        return CreatedAtAction(nameof(Get), new { id = reply.Id }, reply);
    }

    [HttpPatch("{id:long}")]
    public Task<CommentResponse> Update(long id, CommentRequest request, CancellationToken ct) =>
        comments.UpdateAsync(id, User.GetUserId(), request, ct);

    /// <summary>Deletes the comment and every reply beneath it.</summary>
    [HttpDelete("{id:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(long id, CancellationToken ct)
    {
        await comments.DeleteAsync(id, User.GetUserId(), ct);
        return NoContent();
    }

    [HttpPut("{id:long}/like")]
    public Task<LikeState> Like(long id, CancellationToken ct) =>
        comments.LikeAsync(id, User.GetUserId(), ct);

    [HttpDelete("{id:long}/like")]
    public Task<LikeState> Unlike(long id, CancellationToken ct) =>
        comments.UnlikeAsync(id, User.GetUserId(), ct);
}
