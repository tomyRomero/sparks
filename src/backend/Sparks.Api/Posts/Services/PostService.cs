using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Sparks.Api.Activity.Services;
using Sparks.Api.Common.Data;
using Sparks.Api.Common.Errors;
using Sparks.Api.Common.Models;
using Sparks.Api.Posts.Data;
using Sparks.Api.Posts.Models;
using Sparks.Api.Storage;
using Sparks.Api.Users.Models;

namespace Sparks.Api.Posts.Services;

/// <summary>Sparks: the feed, a single post, and writing, editing, deleting and liking posts.</summary>
public sealed class PostService(
    SparksDbContext db, TimeProvider time, IFileStorage storage, ActivityNotifier activity, ILogger<PostService> logger)
{
    /// <summary>Newest posts first, of some kinds, with pictures, or matching a search.</summary>
    public Task<CursorPage<PostResponse>> GetFeedAsync(PostFeedQuery query, long? viewerId, CancellationToken ct) =>
        PageAsync(Filter(db.Posts.AsNoTracking(), query.Kind, query.Pictures, query.Q), query, viewerId, ct);

    /// <summary>How many posts a search finds, for the tab that shows them.</summary>
    public Task<int> CountMatchingAsync(string q, CancellationToken ct) =>
        Filter(db.Posts, kinds: [], pictures: false, q).CountAsync(ct);

    /// <summary>
    /// The most liked posts of the last <see cref="TopPostsQuery.Days"/> days,
    /// newest first among equals. Likes can change between pages, so a post
    /// may move; the cursor holds the like count and the id.
    /// </summary>
    public async Task<OpaqueCursorPage<PostResponse>> GetTopAsync(TopPostsQuery query, long? viewerId, CancellationToken ct)
    {
        var since = time.GetUtcNow().UtcDateTime - TimeSpan.FromDays(query.Days);
        var posts = Filter(db.Posts.AsNoTracking().Where(post => post.CreatedAt >= since), query.Kind, query.Pictures, q: null);
        if (query.Cursor is not null)
        {
            if (OpaqueCursor.Decode(query.Cursor, partCount: 2) is not [var likes, var id])
            {
                throw ApiException.BadRequest("INVALID_CURSOR", "That cursor didn't come from this API.");
            }

            posts = posts.Where(post => post.Likes.Count < likes || (post.Likes.Count == likes && post.Id < id));
        }

        var fetched = await posts
            .OrderByDescending(post => post.Likes.Count)
            .ThenByDescending(post => post.Id)
            .Take(query.Limit + 1)
            .Select(ToResponse(viewerId))
            .ToListAsync(ct);
        var page = fetched.Take(query.Limit).ToList();
        var nextCursor = fetched.Count > query.Limit ? OpaqueCursor.Encode(page[^1].LikeCount, page[^1].Id) : null;
        return new OpaqueCursorPage<PostResponse>(page, nextCursor);
    }

    /// <summary>One member's posts, newest first; only those with a picture for the Pictures grid.</summary>
    public Task<CursorPage<PostResponse>> GetByAuthorAsync(
        long authorId, PageRequest page, bool picturesOnly, long? viewerId, CancellationToken ct) =>
        PageAsync(
            Filter(db.Posts.AsNoTracking().Where(post => post.AuthorId == authorId), kinds: [], picturesOnly, q: null),
            page,
            viewerId,
            ct);

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
                await activity.PostLikedAsync(postId, userId, ct);
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

    private static IQueryable<PostEntity> Filter(IQueryable<PostEntity> posts, SparkKind[] kinds, bool pictures, string? q)
    {
        // Query strings bind numbers too, so anything undefined is dropped.
        var known = kinds.Where(Enum.IsDefined).Distinct().ToArray();
        if (known.Length > 0)
        {
            posts = posts.Where(post => known.Contains(post.Kind));
        }

        if (pictures)
        {
            posts = posts.Where(post => post.ImageKey != null);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            // Case-insensitive through the column collation. A substring
            // search scans, which is fine at Sparks' size; full-text indexing
            // would replace it at scale.
            var text = q.Trim();
            posts = posts.Where(post =>
                post.Body.Contains(text)
                || post.Author.Username.Contains(text)
                || post.Author.DisplayName.Contains(text));
        }

        return posts;
    }

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
