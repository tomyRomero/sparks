using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Sparks.Api.Common.Data;
using Sparks.Api.Common.Errors;
using Sparks.Api.Common.Models;
using Sparks.Api.Posts.Data;
using Sparks.Api.Posts.Models;
using Sparks.Api.Storage;
using Sparks.Api.Users.Models;

namespace Sparks.Api.Posts.Services;

/// <summary>Sparks: the feed, a single post, and writing, editing, deleting and liking posts.</summary>
public sealed class PostService(SparksDbContext db, TimeProvider time, IFileStorage storage, ILogger<PostService> logger)
{
    /// <summary>Newest posts first, optionally of one kind or matching a search.</summary>
    public Task<CursorPage<PostResponse>> GetFeedAsync(PostFeedQuery query, long? viewerId, CancellationToken ct)
    {
        var posts = db.Posts.AsNoTracking();
        if (query.Kind is { } kind)
        {
            posts = posts.Where(post => post.Kind == kind);
        }

        if (!string.IsNullOrWhiteSpace(query.Q))
        {
            // Case-insensitive through the column collation. A substring
            // search scans, which is fine at Sparks' size; full-text indexing
            // would replace it at scale.
            var text = query.Q.Trim();
            posts = posts.Where(post =>
                post.Body.Contains(text)
                || post.Author.Username.Contains(text)
                || post.Author.DisplayName.Contains(text));
        }

        return PageAsync(posts, query, viewerId, ct);
    }

    /// <summary>One member's posts, newest first.</summary>
    public Task<CursorPage<PostResponse>> GetByAuthorAsync(
        long authorId, PageRequest page, long? viewerId, CancellationToken ct) =>
        PageAsync(db.Posts.AsNoTracking().Where(post => post.AuthorId == authorId), page, viewerId, ct);

    /// <summary>
    /// The posts a member liked, newest post first. Ordering by the post
    /// rather than the like keeps one cursor for every post list.
    /// </summary>
    public Task<CursorPage<PostResponse>> GetLikedByAsync(
        long userId, PageRequest page, long? viewerId, CancellationToken ct) =>
        PageAsync(
            db.Posts.AsNoTracking().Where(post => post.Likes.Any(like => like.UserId == userId)),
            page,
            viewerId,
            ct);

    public async Task<PostResponse> GetAsync(long postId, long? viewerId, CancellationToken ct) =>
        await db.Posts.AsNoTracking()
            .Where(post => post.Id == postId)
            .Select(ToResponse(viewerId))
            .SingleOrDefaultAsync(ct)
        ?? throw PostErrors.PostNotFound();

    public async Task<PostResponse> CreateAsync(long authorId, CreatePostRequest request, CancellationToken ct)
    {
        // Only an image the author stored, which is still there, and which no
        // other post uses: deleting a post deletes its image.
        if (request.ImageKey is { } imageKey)
        {
            if (!StorageKeys.BelongsTo(imageKey, StorageKeys.Images, authorId) || !await storage.ExistsAsync(imageKey, ct))
            {
                throw PostErrors.InvalidImage();
            }

            if (await db.Posts.AnyAsync(post => post.ImageKey == imageKey, ct))
            {
                throw PostErrors.ImageAlreadyUsed();
            }
        }

        var post = new PostEntity
        {
            AuthorId = authorId,
            Kind = request.Kind!.Value,
            Body = request.Body.Trim(),
            ImageKey = request.ImageKey,
            AiPrompt = string.IsNullOrWhiteSpace(request.AiPrompt) ? null : request.AiPrompt.Trim(),
            CreatedAt = time.GetUtcNow().UtcDateTime,
        };
        db.Posts.Add(post);
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.IsUniqueViolation())
        {
            // Another post took the image a moment ago; the unique index caught it.
            throw PostErrors.ImageAlreadyUsed();
        }

        return await GetAsync(post.Id, authorId, ct);
    }

    /// <summary>Changes a post's text. Only its author may.</summary>
    public async Task<PostResponse> UpdateAsync(long postId, long userId, UpdatePostRequest request, CancellationToken ct)
    {
        // The author check and the write are one statement, so the post can't
        // be deleted in between.
        var body = request.Body.Trim();
        var editedAt = time.GetUtcNow().UtcDateTime;
        var updated = await db.Posts
            .Where(post => post.Id == postId && post.AuthorId == userId)
            .ExecuteUpdateAsync(set => set
                .SetProperty(post => post.Body, body)
                .SetProperty(post => post.EditedAt, editedAt), ct);
        if (updated == 0)
        {
            throw await RefusalAsync(postId, ct);
        }

        return await GetAsync(postId, userId, ct);
    }

    /// <summary>
    /// Deletes a post with its comments and likes (by cascade), then its
    /// image. Only its author may.
    /// </summary>
    public async Task DeleteAsync(long postId, long userId, CancellationToken ct)
    {
        var own = db.Posts.Where(post => post.Id == postId && post.AuthorId == userId);
        var imageKey = await own.Select(post => post.ImageKey).FirstOrDefaultAsync(ct);
        if (await own.ExecuteDeleteAsync(ct) == 0)
        {
            throw await RefusalAsync(postId, ct);
        }

        if (imageKey is not null)
        {
            await storage.TryDeleteAsync(imageKey, logger);
        }
    }

    /// <summary>Likes a post. Liking twice is harmless: the result is the same.</summary>
    public async Task<LikeState> LikeAsync(long postId, long userId, CancellationToken ct)
    {
        if (!await db.Posts.AnyAsync(post => post.Id == postId, ct))
        {
            throw PostErrors.PostNotFound();
        }

        if (!await db.PostLikes.AnyAsync(like => like.PostId == postId && like.UserId == userId, ct))
        {
            db.PostLikes.Add(new PostLikeEntity { PostId = postId, UserId = userId, CreatedAt = time.GetUtcNow().UtcDateTime });
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
                // The post was deleted since the check above.
                throw PostErrors.PostNotFound();
            }
        }

        return await LikeStateAsync(postId, userId, ct);
    }

    /// <summary>Removes a like. Unliking something not liked is harmless.</summary>
    public async Task<LikeState> UnlikeAsync(long postId, long userId, CancellationToken ct)
    {
        if (!await db.Posts.AnyAsync(post => post.Id == postId, ct))
        {
            throw PostErrors.PostNotFound();
        }

        await db.PostLikes.Where(like => like.PostId == postId && like.UserId == userId).ExecuteDeleteAsync(ct);
        return await LikeStateAsync(postId, userId, ct);
    }

    /// <summary>
    /// The projection every post read uses, with counts and the top comment
    /// computed in SQL. Only comments on the spark itself count as its top
    /// one, never replies.
    /// </summary>
    internal static Expression<Func<PostEntity, PostResponse>> ToResponse(long? viewerId) => post => new PostResponse(
        post.Id,
        post.Kind,
        post.Body,
        FileUrls.Of(post.ImageKey),
        post.AiPrompt,
        post.CreatedAt,
        post.EditedAt,
        new UserSummary(post.Author.Id, post.Author.Username, post.Author.DisplayName, FileUrls.Of(post.Author.AvatarKey)),
        post.Likes.Count,
        post.Comments.Count,
        viewerId != null && post.Likes.Any(like => like.UserId == viewerId),
        post.Comments
            .Where(comment => comment.ParentCommentId == null)
            .OrderByDescending(comment => comment.Likes.Count)
            .ThenBy(comment => comment.Id)
            .Select(comment => new CommentPreview(
                comment.Id,
                comment.Body.Substring(0, CommentPreview.ExcerptLength),
                new UserSummary(
                    comment.Author.Id, comment.Author.Username, comment.Author.DisplayName, FileUrls.Of(comment.Author.AvatarKey))))
            .FirstOrDefault());

    private static async Task<CursorPage<PostResponse>> PageAsync(
        IQueryable<PostEntity> posts, PageRequest page, long? viewerId, CancellationToken ct)
    {
        var fetched = await posts.NewestFirst(page).Select(ToResponse(viewerId)).ToListAsync(ct);
        return CursorPage.From(fetched, page.Limit, post => post.Id);
    }

    /// <summary>Why a write to a post matched no row: it's gone, or it's someone else's.</summary>
    private async Task<ApiException> RefusalAsync(long postId, CancellationToken ct) =>
        await db.Posts.AnyAsync(post => post.Id == postId, ct)
            ? PostErrors.NotYourPost()
            : PostErrors.PostNotFound();

    private async Task<LikeState> LikeStateAsync(long postId, long userId, CancellationToken ct) =>
        await db.Posts
            .Where(post => post.Id == postId)
            .Select(post => new LikeState(post.Likes.Any(like => like.UserId == userId), post.Likes.Count))
            .SingleOrDefaultAsync(ct)
        ?? throw PostErrors.PostNotFound();
}
