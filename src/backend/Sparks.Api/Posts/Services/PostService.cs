using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Hybrid;
using Sparks.Api.Activity.Services;
using Sparks.Api.Common.Data;
using Sparks.Api.Common.Errors;
using Sparks.Api.Common.Models;
using Sparks.Api.Posts.Data;
using Sparks.Api.Posts.Models;
using Sparks.Api.Storage.Services;
using Sparks.Api.Users.Models;

namespace Sparks.Api.Posts.Services;

/// <summary>Sparks: the feed, a single post, and writing, editing, deleting and liking posts.</summary>
public sealed class PostService(
    SparksDbContext db,
    HybridCache cache,
    TimeProvider time,
    IFileStorage storage,
    ActivityNotifier activity,
    ILogger<PostService> logger)
{
    /// <summary>How long everyone shares one ranking of the top posts.</summary>
    private static readonly HybridCacheEntryOptions SharedRankingLifetime = new()
    {
        Expiration = TimeSpan.FromMinutes(1),
        LocalCacheExpiration = TimeSpan.FromMinutes(1),
    };

    /// <summary>Newest posts first, of some kinds, with pictures, from followed members, or matching a search.</summary>
    public Task<CursorPage<PostResponse>> GetFeedAsync(PostFeedQuery query, long? viewerId, CancellationToken ct)
    {
        var posts = Filter(db.Posts.AsNoTracking(), query.Kind, query.Pictures, query.Q);
        return PageAsync(query.Following ? FromFollowed(posts, viewerId) : posts, query, viewerId, ct);
    }

    /// <summary>How many posts a search finds, for the tab that shows them.</summary>
    public Task<int> CountMatchingAsync(string q, CancellationToken ct) =>
        Filter(db.Posts, kinds: [], pictures: false, q).CountAsync(ct);

    /// <summary>
    /// The most liked posts of the last <see cref="TopPostsQuery.Days"/> days,
    /// newest first among equals. Ranking counts every like in the window, so
    /// a first page everyone shares (not Following's) is ranked at most once a
    /// minute; the posts on it, with their counts and the viewer's likes, are
    /// read fresh. Likes can change between pages, so a post may move; the
    /// cursor holds the like count and the id.
    /// </summary>
    public async Task<OpaqueCursorPage<PostResponse>> GetTopAsync(TopPostsQuery query, long? viewerId, CancellationToken ct)
    {
        var ranked = query.Following || query.Cursor is not null
            ? await RankTopAsync(query, viewerId, ct)
            : await cache.GetOrCreateAsync(
                TopRankingKey(query),
                query,
                async (shared, token) => await RankTopAsync(shared, viewerId: null, token),
                SharedRankingLifetime,
                cancellationToken: ct);

        var page = ranked.Take(query.Limit).ToList();
        var ids = page.ConvertAll(post => post.Id);
        var read = (await ReadAsync(db.Posts.AsNoTracking().Where(post => ids.Contains(post.Id)), viewerId, ct))
            .ToDictionary(post => post.Id);

        // A post deleted since the ranking was made is left out.
        var items = page.Where(post => read.ContainsKey(post.Id)).Select(post => read[post.Id]).ToList();
        var nextCursor = ranked.Count > query.Limit ? OpaqueCursor.Encode(page[^1].LikeCount, page[^1].Id) : null;
        return new OpaqueCursorPage<PostResponse>(items, nextCursor);
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
        (await ReadAsync(db.Posts.AsNoTracking().Where(post => post.Id == postId), viewerId, ct)).SingleOrDefault()
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
    /// Reads posts with their counts, then the top comment of each in a
    /// second query. As one query, EF Core ranked every top-level comment in
    /// the database before joining the page to them, which took seconds once
    /// there were tens of thousands; this ranks only the page's comments.
    /// Only comments on the spark itself count as its top one, never replies.
    /// </summary>
    /// <summary>A page of the ranking, with one more post than the page to tell whether more follow.</summary>
    private async Task<List<RankedPost>> RankTopAsync(TopPostsQuery query, long? viewerId, CancellationToken ct)
    {
        var now = time.GetUtcNow().UtcDateTime;
        var since = now - TimeSpan.FromDays(query.Days);
        var inWindow = db.Posts.AsNoTracking().Where(post => post.CreatedAt >= since && post.CreatedAt <= now);
        var posts = Filter(inWindow, query.Kind, query.Pictures, q: null);
        if (query.Following)
        {
            posts = FromFollowed(posts, viewerId);
        }

        if (query.Cursor is not null)
        {
            if (OpaqueCursor.Decode(query.Cursor, partCount: 2) is not [var likes, var id])
            {
                throw OpaqueCursor.Invalid();
            }

            posts = posts.Where(post => post.Likes.Count < likes || (post.Likes.Count == likes && post.Id < id));
        }

        return await posts
            .OrderByDescending(post => post.Likes.Count)
            .ThenByDescending(post => post.Id)
            .Take(query.Limit + 1)
            .Select(post => new RankedPost(post.Id, post.Likes.Count))
            .ToListAsync(ct);
    }

    /// <summary>What sets a shared first page apart: the window, the filters and the page size.</summary>
    private static string TopRankingKey(TopPostsQuery query) =>
        $"posts:top:{query.Days}:{string.Join(',', query.Kind.Where(Enum.IsDefined).Distinct().Order())}:{query.Pictures}:{query.Limit}";

    /// <summary>A post's place in a ranking.</summary>
    private sealed record RankedPost(long Id, int LikeCount);

    private async Task<List<PostResponse>> ReadAsync(IQueryable<PostEntity> posts, long? viewerId, CancellationToken ct)
    {
        var read = await posts.Select(ToResponse(viewerId)).ToListAsync(ct);
        if (read.Count == 0)
        {
            return read;
        }

        var ids = read.Select(post => post.Id).ToArray();
        var topComments = await db.Comments
            .Where(comment => ids.Contains(comment.PostId) && comment.ParentCommentId == null)
            .GroupBy(comment => comment.PostId)
            .Select(thread => thread
                .OrderByDescending(comment => comment.Likes.Count)
                .ThenBy(comment => comment.Id)
                .Select(comment => new
                {
                    comment.PostId,
                    comment.Id,
                    Excerpt = comment.Body.Substring(0, CommentPreview.ExcerptLength),
                    AuthorId = comment.Author.Id,
                    comment.Author.Username,
                    comment.Author.DisplayName,
                    comment.Author.AvatarKey,
                })
                .First())
            .ToDictionaryAsync(
                top => top.PostId,
                top => new CommentPreview(
                    top.Id,
                    top.Excerpt,
                    new UserSummary(top.AuthorId, top.Username, top.DisplayName, FileUrls.Of(top.AvatarKey))),
                ct);
        return read.ConvertAll(post => post with { TopComment = topComments.GetValueOrDefault(post.Id) });
    }

    /// <summary>A post with its counts, computed in SQL; <see cref="ReadAsync"/> adds the top comment.</summary>
    private static Expression<Func<PostEntity, PostResponse>> ToResponse(long? viewerId) => post => new PostResponse(
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
        TopComment: null);

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

    /// <summary>
    /// Posts by the members the viewer follows, and their own, as a
    /// timeline of the people you follow includes what you shared.
    /// </summary>
    private IQueryable<PostEntity> FromFollowed(IQueryable<PostEntity> posts, long? viewerId)
    {
        if (viewerId is not { } me)
        {
            throw PostErrors.SignInForFollowing();
        }

        return posts.Where(post =>
            post.AuthorId == me || db.Follows.Any(follow => follow.FollowerId == me && follow.FolloweeId == post.AuthorId));
    }

    private async Task<CursorPage<PostResponse>> PageAsync(
        IQueryable<PostEntity> posts, PageRequest page, long? viewerId, CancellationToken ct)
    {
        var fetched = await ReadAsync(posts.NewestFirst(page), viewerId, ct);
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
