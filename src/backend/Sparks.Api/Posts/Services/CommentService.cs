using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Sparks.Api.Common.Data;
using Sparks.Api.Common.Errors;
using Sparks.Api.Common.Models;
using Sparks.Api.Posts.Data;
using Sparks.Api.Posts.Models;
using Sparks.Api.Users.Models;

namespace Sparks.Api.Posts.Services;

/// <summary>
/// Comments: a post's thread, a comment's replies, and writing, editing,
/// deleting and liking comments. Threads read oldest first, so a reply
/// always comes after what it answers.
/// </summary>
public sealed class CommentService(SparksDbContext db, TimeProvider time)
{
    /// <summary>The comments made directly on a post. Replies are fetched per comment.</summary>
    public async Task<CursorPage<CommentResponse>> GetForPostAsync(
        long postId, PageRequest page, long? viewerId, CancellationToken ct)
    {
        if (!await db.Posts.AnyAsync(post => post.Id == postId, ct))
        {
            throw PostErrors.PostNotFound();
        }

        return await ToPageAsync(
            db.Comments.AsNoTracking()
                .Where(comment => comment.PostId == postId && comment.ParentCommentId == null)
                .OldestFirst(page),
            page,
            viewerId,
            ct);
    }

    public async Task<CommentResponse> GetAsync(long commentId, long? viewerId, CancellationToken ct) =>
        await db.Comments.AsNoTracking()
            .Where(comment => comment.Id == commentId)
            .Select(ToResponse(viewerId))
            .SingleOrDefaultAsync(ct)
        ?? throw PostErrors.CommentNotFound();

    /// <summary>The direct replies to a comment.</summary>
    public async Task<CursorPage<CommentResponse>> GetRepliesAsync(
        long commentId, PageRequest page, long? viewerId, CancellationToken ct)
    {
        if (!await db.Comments.AnyAsync(comment => comment.Id == commentId, ct))
        {
            throw PostErrors.CommentNotFound();
        }

        return await ToPageAsync(
            db.Comments.AsNoTracking().Where(comment => comment.ParentCommentId == commentId).OldestFirst(page),
            page,
            viewerId,
            ct);
    }

    /// <summary>One member's comments and replies, newest first, for their profile.</summary>
    public Task<CursorPage<CommentResponse>> GetByAuthorAsync(
        long authorId, PageRequest page, long? viewerId, CancellationToken ct) =>
        ToPageAsync(
            db.Comments.AsNoTracking().Where(comment => comment.AuthorId == authorId).NewestFirst(page),
            page,
            viewerId,
            ct);

    public async Task<CommentResponse> CommentOnPostAsync(
        long postId, long authorId, CommentRequest request, CancellationToken ct)
    {
        if (!await db.Posts.AnyAsync(post => post.Id == postId, ct))
        {
            throw PostErrors.PostNotFound();
        }

        return await AddAsync(postId, parentCommentId: null, authorId, request, PostErrors.PostNotFound, ct);
    }

    /// <summary>Replies to a comment. The reply joins its parent's thread, on the same post.</summary>
    public async Task<CommentResponse> ReplyAsync(
        long parentCommentId, long authorId, CommentRequest request, CancellationToken ct)
    {
        var postId = await db.Comments
            .Where(comment => comment.Id == parentCommentId)
            .Select(comment => (long?)comment.PostId)
            .SingleOrDefaultAsync(ct)
            ?? throw PostErrors.CommentNotFound();

        return await AddAsync(postId, parentCommentId, authorId, request, PostErrors.CommentNotFound, ct);
    }

    /// <summary>Changes a comment's text. Only its author may.</summary>
    public async Task<CommentResponse> UpdateAsync(
        long commentId, long userId, CommentRequest request, CancellationToken ct)
    {
        // The author check and the write are one statement, so the comment
        // can't be deleted in between.
        var body = request.Body.Trim();
        var editedAt = time.GetUtcNow().UtcDateTime;
        var updated = await db.Comments
            .Where(comment => comment.Id == commentId && comment.AuthorId == userId)
            .ExecuteUpdateAsync(set => set
                .SetProperty(comment => comment.Body, body)
                .SetProperty(comment => comment.EditedAt, editedAt), ct);
        if (updated == 0)
        {
            throw await RefusalAsync(commentId, ct);
        }

        return await GetAsync(commentId, userId, ct);
    }

    /// <summary>
    /// Deletes a comment with every reply beneath it, and their likes. Only
    /// its author may.
    /// </summary>
    public async Task DeleteAsync(long commentId, long userId, CancellationToken ct)
    {
        // SQL Server can't cascade through the replies' reference to their
        // parent, so one statement walks down the thread and deletes the
        // comment and all its replies together (their likes cascade).
        // UPDLOCK, HOLDLOCK keep what it reads locked until the delete
        // commits: a reply posted meanwhile waits, then finds its parent gone
        // (a 404) instead of breaking the delete, and two overlapping deletes
        // queue instead of deadlocking.
        var deleted = await db.Database.ExecuteSqlAsync(
            $"""
            WITH thread AS (
                SELECT id FROM comments WITH (UPDLOCK, HOLDLOCK)
                WHERE id = {commentId} AND author_id = {userId}
                UNION ALL
                SELECT reply.id FROM comments AS reply WITH (UPDLOCK, HOLDLOCK)
                INNER JOIN thread ON reply.parent_comment_id = thread.id
            )
            DELETE FROM comments WHERE id IN (SELECT id FROM thread)
            OPTION (MAXRECURSION 0);
            """,
            ct);
        if (deleted == 0)
        {
            throw await RefusalAsync(commentId, ct);
        }
    }

    /// <summary>Likes a comment. Liking twice is harmless: the result is the same.</summary>
    public async Task<LikeState> LikeAsync(long commentId, long userId, CancellationToken ct)
    {
        if (!await db.Comments.AnyAsync(comment => comment.Id == commentId, ct))
        {
            throw PostErrors.CommentNotFound();
        }

        if (!await db.CommentLikes.AnyAsync(like => like.CommentId == commentId && like.UserId == userId, ct))
        {
            db.CommentLikes.Add(new CommentLikeEntity
            {
                CommentId = commentId,
                UserId = userId,
                CreatedAt = time.GetUtcNow().UtcDateTime,
            });
            try
            {
                await db.SaveChangesAsync(ct);
            }
            catch (DbUpdateException ex) when (ex.IsUniqueViolation())
            {
                // A concurrent request liked it first; the outcome is the same.
            }
            catch (DbUpdateException ex) when (ex.IsForeignKeyViolation())
            {
                // The comment was deleted since the check above.
                throw PostErrors.CommentNotFound();
            }
        }

        return await LikeStateAsync(commentId, userId, ct);
    }

    /// <summary>Removes a like. Unliking something not liked is harmless.</summary>
    public async Task<LikeState> UnlikeAsync(long commentId, long userId, CancellationToken ct)
    {
        if (!await db.Comments.AnyAsync(comment => comment.Id == commentId, ct))
        {
            throw PostErrors.CommentNotFound();
        }

        await db.CommentLikes
            .Where(like => like.CommentId == commentId && like.UserId == userId)
            .ExecuteDeleteAsync(ct);
        return await LikeStateAsync(commentId, userId, ct);
    }

    /// <summary>The projection every comment read uses, with counts computed in SQL.</summary>
    internal static Expression<Func<CommentEntity, CommentResponse>> ToResponse(long? viewerId) =>
        comment => new CommentResponse(
            comment.Id,
            comment.PostId,
            comment.ParentCommentId,
            comment.Body,
            comment.CreatedAt,
            comment.EditedAt,
            new UserSummary(comment.Author.Id, comment.Author.Username, comment.Author.DisplayName),
            comment.Likes.Count,
            comment.Replies.Count,
            viewerId != null && comment.Likes.Any(like => like.UserId == viewerId));

    private async Task<CommentResponse> AddAsync(
        long postId,
        long? parentCommentId,
        long authorId,
        CommentRequest request,
        Func<ApiException> whenAnsweredIsGone,
        CancellationToken ct)
    {
        var comment = new CommentEntity
        {
            PostId = postId,
            ParentCommentId = parentCommentId,
            AuthorId = authorId,
            Body = request.Body.Trim(),
            CreatedAt = time.GetUtcNow().UtcDateTime,
        };
        db.Comments.Add(comment);
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.IsForeignKeyViolation())
        {
            // The post or comment being answered was deleted since the check.
            throw whenAnsweredIsGone();
        }

        return await GetAsync(comment.Id, authorId, ct);
    }

    /// <summary>Projects one page of rows, already ordered and cut by <see cref="CursorPaging"/>.</summary>
    private static async Task<CursorPage<CommentResponse>> ToPageAsync(
        IQueryable<CommentEntity> pageRows, PageRequest page, long? viewerId, CancellationToken ct)
    {
        var fetched = await pageRows.Select(ToResponse(viewerId)).ToListAsync(ct);
        return CursorPage.From(fetched, page.Limit, comment => comment.Id);
    }

    /// <summary>Why a write to a comment matched no row: it's gone, or it's someone else's.</summary>
    private async Task<ApiException> RefusalAsync(long commentId, CancellationToken ct) =>
        await db.Comments.AnyAsync(comment => comment.Id == commentId, ct)
            ? PostErrors.NotYourComment()
            : PostErrors.CommentNotFound();

    private async Task<LikeState> LikeStateAsync(long commentId, long userId, CancellationToken ct) =>
        await db.Comments
            .Where(comment => comment.Id == commentId)
            .Select(comment => new LikeState(comment.Likes.Any(like => like.UserId == userId), comment.Likes.Count))
            .SingleOrDefaultAsync(ct)
        ?? throw PostErrors.CommentNotFound();
}
