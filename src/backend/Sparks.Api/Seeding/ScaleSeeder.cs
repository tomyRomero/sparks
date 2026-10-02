using System.Collections.Concurrent;
using System.Data;
using System.Diagnostics;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Sparks.Api.Ai.Providers;
using Sparks.Api.Auth.Services;
using Sparks.Api.Common.Data;
using Sparks.Api.Posts.Data;
using Sparks.Api.Storage.Services;

namespace Sparks.Api.Seeding;

/// <summary>How much <see cref="ScaleSeeder"/> adds on top of the demo data.</summary>
public sealed record ScaleOptions
{
    public int Members { get; init; } = 2_000;
    public int Sparks { get; init; } = 30_000;

    /// <summary>Of <see cref="Sparks"/>, how many are the main member's.</summary>
    public int MainSparks { get; init; } = 300;

    /// <summary>Sparks with a picture, a few dozen of them the main member's.</summary>
    public int Pictures { get; init; } = 1_200;

    public int Avatars { get; init; } = 300;
    public int Likes { get; init; } = 400_000;
    public int Comments { get; init; } = 80_000;

    /// <summary>Comments on the main member's most liked spark, a long thread to page through.</summary>
    public int ViralComments { get; init; } = 600;

    public int CommentLikes { get; init; } = 60_000;
    public int Follows { get; init; } = 120_000;

    /// <summary>People the main member follows; nearly everyone follows them.</summary>
    public int MainFollowing { get; init; } = 300;

    /// <summary>Chats between the main member and new members.</summary>
    public int MainConversations { get; init; } = 300;

    /// <summary>Chats between other members.</summary>
    public int OtherConversations { get; init; } = 2_000;

    public int Messages { get; init; } = 40_000;

    /// <summary>Messages in the main member's longest chat, to page back through.</summary>
    public int LongChat { get; init; } = 8_000;

    /// <summary>How far back the sparks go.</summary>
    public TimeSpan Span { get; init; } = TimeSpan.FromDays(120);
}

/// <summary>
/// Thousands of members and hundreds of thousands of likes, follows,
/// comments and messages on top of the demo data, to see how the app holds
/// up with a lot in it. Unlike <see cref="DemoSeeder"/> it writes rows in
/// bulk (SqlBulkCopy, one transaction) rather than through the services,
/// which would take hours, so it sets every count and time itself. Ids follow
/// time order, as the app's cursors expect, and foreign keys and check
/// constraints are checked on the way in.
/// </summary>
public sealed class ScaleSeeder(
    SparksDbContext db,
    ImageUploadService images,
    TimeProvider time,
    ILogger<ScaleSeeder> logger)
{
    /// <summary>Scale members' emails end with this, which also marks a database as scaled.</summary>
    public const string EmailDomain = "@scale.sparks.test";

    private const int ImageWorkers = 8;

    private static readonly (SparkKind Kind, int Weight)[] KindMix =
    [
        (SparkKind.Regular, 34), (SparkKind.Haiku, 10), (SparkKind.Quote, 8), (SparkKind.Aphorism, 7),
        (SparkKind.Joke, 9), (SparkKind.Photography, 9), (SparkKind.Artwork, 7), (SparkKind.Fashion, 5),
        (SparkKind.MovieScript, 6), (SparkKind.BookPlot, 5),
    ];

    private static readonly SparkKind[] PictureKinds =
        [SparkKind.Photography, SparkKind.Artwork, SparkKind.Fashion, SparkKind.MovieScript, SparkKind.BookPlot];

    // Pictures at this volume come from the sample generator whichever
    // provider is configured: thousands of AI pictures would take hours and
    // use up a free tier.
    private readonly SampleImageGenerator _painter = new();
    private readonly Random _random = new(2026);
    private readonly Stopwatch _elapsed = new();
    private DateTime _now;

    /// <summary>Seeds once, after the demo data; returns false when the database is already scaled.</summary>
    public async Task<bool> RunAsync(string password, ScaleOptions options, CancellationToken ct)
    {
        if (await db.Users.AnyAsync(user => user.Email.EndsWith(EmailDomain), ct))
        {
            logger.LogInformation("This database already has the scale data");
            return false;
        }

        var main = await db.Users
            .Where(user => user.Username == DemoSeeder.MainUsername)
            .Select(user => new Person(user.Id, user.CreatedAt))
            .SingleOrDefaultAsync(ct)
            ?? throw new InvalidOperationException("Seed the demo data before the scale data.");

        _elapsed.Start();
        _now = time.GetUtcNow().UtcDateTime;
        var content = new ScaleContent(_random);
        var start = _now - options.Span;

        var everyoneBefore = await db.Users.Select(user => new Person(user.Id, user.CreatedAt)).ToListAsync(ct);
        var members = NewMembers(options, content, await NextIdAsync(db.Users.MaxAsync(user => (long?)user.Id, ct)), start);
        var people = everyoneBefore.Concat(members.Select(member => member.Person)).ToList();
        main = people.Single(person => person.Id == main.Id);
        GivePull(people, main);

        var sparks = NewSparks(options, content, people, main, start, await NextIdAsync(db.Posts.MaxAsync(post => (long?)post.Id, ct)));
        var likes = NewLikes(options, sparks, people, main);
        var comments = NewComments(options, content, sparks, people, main, await NextIdAsync(db.Comments.MaxAsync(comment => (long?)comment.Id, ct)));
        var commentLikes = NewCommentLikes(options, comments, people);
        var follows = NewFollows(options, people, main, await ExistingFollowsAsync(ct));
        var (conversations, messages) = NewChats(
            options,
            content,
            people,
            members,
            main,
            await ExistingPairsAsync(ct),
            await NextIdAsync(db.Conversations.MaxAsync(conversation => (long?)conversation.Id, ct)),
            await NextIdAsync(db.Messages.MaxAsync(message => (long?)message.Id, ct)));
        Log($"Generated {members.Count} members, {sparks.Count} sparks, {likes.Count} likes, {comments.Count} comments, " +
            $"{commentLikes.Count} comment likes, {follows.Count} follows, {conversations.Count} chats and {messages.Count} messages");

        await PaintAsync(members, sparks, options, ct);

        var passwordHash = Passwords.Hash(password);
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var sql = (SqlConnection)db.Database.GetDbConnection();
        var sqlTransaction = (SqlTransaction)transaction.GetDbTransaction();
        await BulkInsertAsync(sql, sqlTransaction, "users", UserRows(members, passwordHash), ct);
        await BulkInsertAsync(sql, sqlTransaction, "posts", SparkRows(sparks), ct);
        await BulkInsertAsync(sql, sqlTransaction, "post_likes", LikeRows("post_id", likes), ct);
        await BulkInsertAsync(sql, sqlTransaction, "comments", CommentRows(comments), ct);
        await BulkInsertAsync(sql, sqlTransaction, "comment_likes", LikeRows("comment_id", commentLikes), ct);
        await BulkInsertAsync(sql, sqlTransaction, "follows", FollowRows(follows), ct);
        await BulkInsertAsync(sql, sqlTransaction, "conversations", ConversationRows(conversations), ct);
        await BulkInsertAsync(sql, sqlTransaction, "messages", MessageRows(messages), ct);

        // The main member last caught up a day ago, so their activity has a
        // day of likes, comments and follows waiting.
        DateTime? readAt = _now.AddDays(-1);
        await db.Users
            .Where(user => user.Id == main.Id)
            .ExecuteUpdateAsync(set => set.SetProperty(user => user.ActivityReadAt, readAt), ct);
        await transaction.CommitAsync(ct);

        Log("Seeded the scale data");
        return true;
    }

    private List<NewMember> NewMembers(ScaleOptions options, ScaleContent content, long firstId, DateTime start)
    {
        var usernames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var joined = Enumerable.Range(0, options.Members)
            .Select(_ => Between(start.AddDays(-60), _now.AddDays(-3)))
            .Order()
            .ToList();

        var members = new List<NewMember>(options.Members);
        for (var i = 0; i < options.Members; i++)
        {
            var (first, last) = content.Name();
            var username = $"{first}_{last}".ToLowerInvariant();
            for (var n = 2; !usernames.Add(username); n++)
            {
                username = $"{first}_{last}{n}".ToLowerInvariant();
            }

            // Most were around this week; a few never came back.
            var seenAgo = _random.NextDouble() < 0.85
                ? TimeSpan.FromHours(Math.Pow(_random.NextDouble(), 3) * 24 * 7)
                : TimeSpan.FromDays(_random.Next(8, 60));
            var seenAt = _now - seenAgo < joined[i] ? joined[i] : _now - seenAgo;
            members.Add(new NewMember(
                new Person(firstId + i, joined[i]), username, $"{first} {last}", content.Bio(), seenAt));
        }

        return members;
    }

    /// <summary>
    /// How much attention each person draws, from a long tail: a few members
    /// are followed, liked and messaged far more than the rest, the main
    /// member among them.
    /// </summary>
    private void GivePull(List<Person> people, Person main)
    {
        var ranks = Enumerable.Range(1, people.Count).OrderBy(_ => _random.Next()).ToArray();
        for (var i = 0; i < people.Count; i++)
        {
            people[i].Pull = 1 / Math.Pow(ranks[i], 0.8);
        }

        main.Pull = 1;
    }

    private List<NewSpark> NewSparks(
        ScaleOptions options,
        ScaleContent content,
        List<Person> people,
        Person main,
        DateTime start,
        long firstId)
    {
        // Popular members post more, but not so much more that they fill the feed.
        var authors = new WeightedPicker<Person>(people.Where(person => person != main).ToList(), person => Math.Sqrt(person.Pull), _random);
        var kinds = new WeightedPicker<(SparkKind Kind, int Weight)>(KindMix, mix => mix.Weight, _random);
        var sparks = new List<NewSpark>(options.Sparks);
        for (var i = 0; i < options.Sparks; i++)
        {
            var author = i < options.MainSparks ? main : authors.Next();
            var kind = kinds.Next().Kind;

            // More of them recently, as on any growing network.
            var from = author.JoinedAt > start ? author.JoinedAt : start;
            var at = _now - ((_now - from) * Math.Pow(_random.NextDouble(), 1.15));
            sparks.Add(new NewSpark(author, kind, content.Spark(kind), at));
        }

        // Pictures go mostly to the kinds that are about something to see,
        // including a few dozen of the main member's.
        var mainPictures = Math.Min(options.Pictures / 20, options.MainSparks);
        foreach (var spark in sparks.Where(spark => spark.Author == main).Take(mainPictures))
        {
            spark.WantsPicture = true;
        }

        var visual = sparks.Where(spark => !spark.WantsPicture && PictureKinds.Contains(spark.Kind)).OrderBy(_ => _random.Next());
        foreach (var spark in visual.Take(options.Pictures - mainPictures))
        {
            spark.WantsPicture = true;
        }

        sparks.Sort((a, b) => a.At.CompareTo(b.At));
        for (var i = 0; i < sparks.Count; i++)
        {
            sparks[i].Id = firstId + i;
        }

        return sparks;
    }

    private List<NewLike> NewLikes(ScaleOptions options, List<NewSpark> sparks, List<Person> people, Person main)
    {
        // Each spark gets a share of the likes from its author's pull and a
        // long-tailed dose of luck; the main member's luckiest spark goes viral.
        var weights = sparks.Select(spark => Math.Pow(spark.Author.Pull, 0.4) * Pareto(1.6)).ToArray();
        var viral = sparks[Enumerable.Range(0, sparks.Count).Where(i => sparks[i].Author == main).MaxBy(i => weights[i])];
        var total = weights.Sum();
        var likes = new List<NewLike>(options.Likes);
        for (var i = 0; i < sparks.Count; i++)
        {
            var spark = sparks[i];
            // Even a hit reaches under half the members, each its own share;
            // only the viral one reaches nearly all.
            var count = spark == viral
                ? (int)(people.Count * 0.9)
                : Math.Min((int)Math.Round(options.Likes * weights[i] / total), (int)(people.Count * (0.15 + (0.3 * _random.NextDouble()))));
            foreach (var fan in Sample(people, count, spark.Author))
            {
                likes.Add(new NewLike(spark.Id, fan.Id, After(spark.At, fan.JoinedAt, meanHours: 30)));
            }

            spark.Likes = count;
        }

        return likes;
    }

    private List<NewComment> NewComments(
        ScaleOptions options,
        ScaleContent content,
        List<NewSpark> sparks,
        List<Person> people,
        Person main,
        long firstId)
    {
        var commenters = new WeightedPicker<Person>(people, person => Math.Pow(person.Pull, 0.3), _random);
        var viral = sparks.Where(spark => spark.Author == main).MaxBy(spark => spark.Likes);
        var weights = sparks.Select(spark => spark == viral ? 0 : Math.Pow(spark.Likes + 1, 0.8) * _random.NextDouble()).ToArray();
        var total = weights.Sum();
        var comments = new List<NewComment>(options.Comments);
        for (var i = 0; i < sparks.Count; i++)
        {
            var spark = sparks[i];
            var count = spark == viral ? options.ViralComments : (int)Math.Round(options.Comments * weights[i] / total);
            var topLevel = new List<NewComment>();
            for (var c = 0; c < count; c++)
            {
                var author = commenters.Next();

                // A quarter answer a comment already there.
                if (topLevel.Count > 0 && _random.NextDouble() < 0.25)
                {
                    var parent = topLevel[_random.Next(topLevel.Count)];
                    comments.Add(new NewComment(spark.Id, author, content.Reply(), After(parent.At, author.JoinedAt, meanHours: 6), parent));
                }
                else
                {
                    var comment = new NewComment(spark.Id, author, content.Comment(), After(spark.At, author.JoinedAt, meanHours: 20), null);
                    topLevel.Add(comment);
                    comments.Add(comment);
                }
            }
        }

        comments.Sort((a, b) => a.At.CompareTo(b.At));
        for (var i = 0; i < comments.Count; i++)
        {
            comments[i].Id = firstId + i;
        }

        return comments;
    }

    private List<NewLike> NewCommentLikes(ScaleOptions options, List<NewComment> comments, List<Person> people)
    {
        var weights = comments.Select(_ => Pareto(1.5)).ToArray();
        var total = weights.Sum();
        var likes = new List<NewLike>(options.CommentLikes);
        for (var i = 0; i < comments.Count; i++)
        {
            var comment = comments[i];
            var count = (int)Math.Round(options.CommentLikes * weights[i] / total);
            foreach (var fan in Sample(people, Math.Min(count, people.Count - 1), comment.Author))
            {
                likes.Add(new NewLike(comment.Id, fan.Id, After(comment.At, fan.JoinedAt, meanHours: 12)));
            }
        }

        return likes;
    }

    private List<NewFollow> NewFollows(ScaleOptions options, List<Person> people, Person main, HashSet<(long, long)> existing)
    {
        var follows = new List<NewFollow>(options.Follows);
        var pairs = new HashSet<(long Follower, long Followee)>(existing);

        bool Add(Person follower, Person followee)
        {
            if (follower == followee || !pairs.Add((follower.Id, followee.Id)))
            {
                return false;
            }

            var from = follower.JoinedAt > followee.JoinedAt ? follower.JoinedAt : followee.JoinedAt;
            follows.Add(new NewFollow(follower.Id, followee.Id, Between(from, _now)));
            return true;
        }

        foreach (var fan in people.Where(person => person != main && _random.NextDouble() < 0.9))
        {
            Add(fan, main);
        }

        foreach (var followee in Sample(people, Math.Min(options.MainFollowing, people.Count - 1), main))
        {
            Add(main, followee);
        }

        // Everyone else follows a long-tailed number of people, mostly the
        // ones who draw the most attention.
        var popular = new WeightedPicker<Person>(people, person => person.Pull, _random);
        var others = people.Where(person => person != main).ToList();
        var perPerson = Math.Max(0, options.Follows - follows.Count) / (double)others.Count;
        foreach (var follower in others)
        {
            // Pareto(2.2) averages 1.83, so this averages perPerson.
            var wanted = (int)Math.Round(perPerson * Pareto(2.2) * 0.55);
            var added = 0;
            for (var attempt = 0; added < wanted && attempt < wanted * 3; attempt++)
            {
                if (Add(follower, popular.Next()))
                {
                    added++;
                }
            }
        }

        return follows;
    }

    private (List<NewConversation> Conversations, List<NewMessage> Messages) NewChats(
        ScaleOptions options,
        ScaleContent content,
        List<Person> people,
        List<NewMember> members,
        Person main,
        HashSet<(long, long)> existing,
        long firstConversationId,
        long firstMessageId)
    {
        var pairs = new HashSet<(long, long)>(existing);
        var conversations = new List<NewConversation>();

        bool TryAdd(Person one, Person other)
        {
            var key = one.Id < other.Id ? (one.Id, other.Id) : (other.Id, one.Id);
            if (one == other || !pairs.Add(key))
            {
                return false;
            }

            conversations.Add(new NewConversation(one, other));
            return true;
        }

        foreach (var member in members.OrderBy(_ => _random.Next()).Take(options.MainConversations))
        {
            TryAdd(main, member.Person);
        }

        for (var attempt = 0; conversations.Count < options.MainConversations + options.OtherConversations && attempt < options.OtherConversations * 5; attempt++)
        {
            var other = people[_random.Next(people.Count)];
            if (other != main)
            {
                TryAdd(members[_random.Next(members.Count)].Person, other);
            }
        }

        // The main member's first chat is the long one; the rest share what's
        // left by a long tail, at least one message each.
        var rest = Math.Max(conversations.Count, options.Messages - options.LongChat);
        var weights = conversations.Select(_ => Pareto(1.6)).ToArray();
        weights[0] = 0;
        var total = weights.Sum();
        var messages = new List<NewMessage>(options.Messages);
        for (var i = 0; i < conversations.Count; i++)
        {
            var conversation = conversations[i];
            var count = i == 0 ? options.LongChat : Math.Max(1, (int)Math.Round(rest * weights[i] / total));
            var (one, other) = (conversation.One, conversation.Other);
            var from = one.JoinedAt > other.JoinedAt ? one.JoinedAt : other.JoinedAt;

            // Each chat last moved a while ago (the long one just now), and its
            // messages spread out before that.
            var end = i == 0 ? _now.AddMinutes(-2) : _now - TimeSpan.FromHours(-Math.Log(1 - _random.NextDouble()) * 40);
            end = end > from ? end : Between(from, _now);
            var start = Between(from, end);
            var times = Enumerable.Range(0, count).Select(_ => Between(start, end)).Order().ToList();
            var sender = _random.Next(2) == 0 ? one : other;
            var thread = new List<NewMessage>(count);
            string? line = null;
            foreach (var at in times)
            {
                if (_random.NextDouble() < 0.55)
                {
                    sender = sender == one ? other : one;
                }

                line = content.ChatLine(after: line);
                thread.Add(new NewMessage(conversation, sender.Id, line, at, at.AddMinutes(_random.Next(1, 90))));
            }

            // Some chats end with a few messages the main member hasn't read.
            var unread = conversation.One == main && _random.NextDouble() < 0.1 ? _random.Next(1, 4) : 0;
            foreach (var message in thread.AsEnumerable().Reverse().TakeWhile(message => message.SenderId != main.Id).Take(unread))
            {
                message.ReadAt = null;
            }

            foreach (var message in thread.Where(message => message.ReadAt > _now))
            {
                message.ReadAt = _now;
            }

            conversation.StartedAt = thread[0].At;
            conversation.LastMessageAt = thread[^1].At;
            messages.AddRange(thread);
        }

        conversations.Sort((a, b) => a.StartedAt.CompareTo(b.StartedAt));
        for (var i = 0; i < conversations.Count; i++)
        {
            conversations[i].Id = firstConversationId + i;
        }

        messages.Sort((a, b) => a.At.CompareTo(b.At));
        for (var i = 0; i < messages.Count; i++)
        {
            messages[i].Id = firstMessageId + i;
        }

        return (conversations, messages);
    }

    /// <summary>Paints avatars and pictures, several at a time.</summary>
    private async Task PaintAsync(List<NewMember> members, List<NewSpark> sparks, ScaleOptions options, CancellationToken ct)
    {
        var jobs = members.OrderBy(_ => _random.Next())
            .Take(options.Avatars)
            .Select(member => (Prompt: $"A portrait of {member.DisplayName}", Folder: StorageKeys.Avatars, OwnerId: member.Person.Id, Store: (Action<string>)(key => member.AvatarKey = key)))
            .Concat(sparks.Where(spark => spark.WantsPicture)
                .Select(spark => (Prompt: spark.Body, Folder: StorageKeys.Images, OwnerId: spark.Author.Id, Store: (Action<string>)(key => spark.ImageKey = key))))
            .ToList();

        var keys = new ConcurrentBag<(Action<string> Set, string Key)>();
        await Parallel.ForEachAsync(
            jobs,
            new ParallelOptions { MaxDegreeOfParallelism = ImageWorkers, CancellationToken = ct },
            async (job, token) =>
            {
                var bytes = await _painter.GenerateAsync(job.Prompt, token);
                await using var stream = new MemoryStream(bytes, writable: false);
                keys.Add((job.Store, await images.SaveAsync(stream, job.Folder, job.OwnerId, token)));
            });

        foreach (var (set, key) in keys)
        {
            set(key);
        }

        Log($"Stored {jobs.Count} avatars and pictures");
    }

    private async Task BulkInsertAsync(SqlConnection connection, SqlTransaction transaction, string table, DataTable rows, CancellationToken ct)
    {
        using var copy = new SqlBulkCopy(
            connection,
            SqlBulkCopyOptions.KeepIdentity | SqlBulkCopyOptions.CheckConstraints | SqlBulkCopyOptions.TableLock,
            transaction)
        {
            DestinationTableName = table,
            BatchSize = 20_000,
            BulkCopyTimeout = 0,
        };
        foreach (DataColumn column in rows.Columns)
        {
            copy.ColumnMappings.Add(column.ColumnName, column.ColumnName);
        }

        await copy.WriteToServerAsync(rows, ct);
        Log($"Wrote {rows.Rows.Count} rows to {table}");
    }

    private DataTable UserRows(List<NewMember> members, string passwordHash)
    {
        var table = Table(
            ("id", typeof(long)), ("username", typeof(string)), ("display_name", typeof(string)), ("email", typeof(string)),
            ("password_hash", typeof(string)), ("bio", typeof(string)), ("avatar_key", typeof(string)),
            ("created_at", typeof(DateTime)), ("last_seen_at", typeof(DateTime)));
        foreach (var member in members)
        {
            table.Rows.Add(
                member.Person.Id, member.Username, member.DisplayName, member.Username + EmailDomain, passwordHash,
                (object?)member.Bio ?? DBNull.Value, (object?)member.AvatarKey ?? DBNull.Value, member.Person.JoinedAt, member.SeenAt);
        }

        return table;
    }

    private static DataTable SparkRows(List<NewSpark> sparks)
    {
        var table = Table(
            ("id", typeof(long)), ("author_id", typeof(long)), ("kind", typeof(string)), ("body", typeof(string)),
            ("image_key", typeof(string)), ("created_at", typeof(DateTime)));
        foreach (var spark in sparks)
        {
            table.Rows.Add(spark.Id, spark.Author.Id, spark.Kind.ToString(), spark.Body, (object?)spark.ImageKey ?? DBNull.Value, spark.At);
        }

        return table;
    }

    private static DataTable LikeRows(string subjectColumn, List<NewLike> likes)
    {
        var table = Table((subjectColumn, typeof(long)), ("user_id", typeof(long)), ("created_at", typeof(DateTime)));
        foreach (var like in likes)
        {
            table.Rows.Add(like.SubjectId, like.UserId, like.At);
        }

        return table;
    }

    private static DataTable CommentRows(List<NewComment> comments)
    {
        var table = Table(
            ("id", typeof(long)), ("post_id", typeof(long)), ("author_id", typeof(long)), ("parent_comment_id", typeof(long)),
            ("body", typeof(string)), ("created_at", typeof(DateTime)));
        foreach (var comment in comments)
        {
            table.Rows.Add(comment.Id, comment.PostId, comment.Author.Id, (object?)comment.Parent?.Id ?? DBNull.Value, comment.Body, comment.At);
        }

        return table;
    }

    private static DataTable FollowRows(List<NewFollow> follows)
    {
        var table = Table(("follower_id", typeof(long)), ("followee_id", typeof(long)), ("created_at", typeof(DateTime)));
        foreach (var follow in follows)
        {
            table.Rows.Add(follow.FollowerId, follow.FolloweeId, follow.At);
        }

        return table;
    }

    private static DataTable ConversationRows(List<NewConversation> conversations)
    {
        var table = Table(
            ("id", typeof(long)), ("user_a_id", typeof(long)), ("user_b_id", typeof(long)),
            ("created_at", typeof(DateTime)), ("last_message_at", typeof(DateTime)));
        foreach (var conversation in conversations)
        {
            // Stored with the lower id first (ck_conversations_user_order).
            var (a, b) = conversation.One.Id < conversation.Other.Id
                ? (conversation.One.Id, conversation.Other.Id)
                : (conversation.Other.Id, conversation.One.Id);
            table.Rows.Add(conversation.Id, a, b, conversation.StartedAt, conversation.LastMessageAt);
        }

        return table;
    }

    private static DataTable MessageRows(List<NewMessage> messages)
    {
        var table = Table(
            ("id", typeof(long)), ("conversation_id", typeof(long)), ("sender_id", typeof(long)), ("body", typeof(string)),
            ("created_at", typeof(DateTime)), ("read_at", typeof(DateTime)));
        foreach (var message in messages)
        {
            table.Rows.Add(
                message.Id, message.Conversation.Id, message.SenderId, message.Body, message.At, (object?)message.ReadAt ?? DBNull.Value);
        }

        return table;
    }

    private static DataTable Table(params (string Name, Type Type)[] columns)
    {
        var table = new DataTable();
        foreach (var (name, type) in columns)
        {
            table.Columns.Add(name, type);
        }

        return table;
    }

    private async Task<HashSet<(long, long)>> ExistingFollowsAsync(CancellationToken ct) =>
        (await db.Follows.Select(follow => new { follow.FollowerId, follow.FolloweeId }).ToListAsync(ct))
        .Select(follow => (follow.FollowerId, follow.FolloweeId))
        .ToHashSet();

    private async Task<HashSet<(long, long)>> ExistingPairsAsync(CancellationToken ct) =>
        (await db.Conversations.Select(conversation => new { conversation.UserAId, conversation.UserBId }).ToListAsync(ct))
        .Select(conversation => (conversation.UserAId, conversation.UserBId))
        .ToHashSet();

    private static async Task<long> NextIdAsync(Task<long?> max) => (await max ?? 0) + 1;

    /// <summary>
    /// Up to <paramref name="count"/> different people, never <paramref name="except"/>.
    /// Picks by rejection for small samples and by a partial shuffle for large ones.
    /// </summary>
    private IEnumerable<Person> Sample(List<Person> people, int count, Person except)
    {
        if (count <= 0)
        {
            return [];
        }

        if (count < people.Count / 4)
        {
            var chosen = new HashSet<Person>();
            while (chosen.Count < count)
            {
                var person = people[_random.Next(people.Count)];
                if (person != except)
                {
                    chosen.Add(person);
                }
            }

            return chosen;
        }

        var pool = people.Where(person => person != except).ToArray();
        for (var i = 0; i < count; i++)
        {
            var j = _random.Next(i, pool.Length);
            (pool[i], pool[j]) = (pool[j], pool[i]);
        }

        return pool.Take(count);
    }

    /// <summary>A moment after both <paramref name="since"/> and <paramref name="joined"/>, usually soon after, never in the future.</summary>
    private DateTime After(DateTime since, DateTime joined, double meanHours)
    {
        var from = since > joined ? since : joined;
        var at = from + TimeSpan.FromHours(-Math.Log(1 - _random.NextDouble()) * meanHours);
        return at < _now ? at : Between(from, _now);
    }

    private DateTime Between(DateTime from, DateTime to) =>
        to <= from ? from : from + ((to - from) * _random.NextDouble());

    /// <summary>A long-tailed draw: usually near 1, now and then far larger.</summary>
    private double Pareto(double shape) => Math.Pow(1 - _random.NextDouble(), -1 / shape);

    private void Log(string step) => logger.LogInformation("{Step} ({Seconds:0.0} s)", step, _elapsed.Elapsed.TotalSeconds);

    /// <summary>Someone in the data, new or already there, and how much attention they draw.</summary>
    private sealed class Person(long id, DateTime joinedAt)
    {
        public long Id { get; } = id;
        public DateTime JoinedAt { get; } = joinedAt;
        public double Pull { get; set; } = 1;
    }

    private sealed record NewMember(Person Person, string Username, string DisplayName, string? Bio, DateTime SeenAt)
    {
        public string? AvatarKey { get; set; }
    }

    private sealed class NewSpark(Person author, SparkKind kind, string body, DateTime at)
    {
        public long Id { get; set; }
        public Person Author { get; } = author;
        public SparkKind Kind { get; } = kind;
        public string Body { get; } = body;
        public DateTime At { get; } = at;
        public bool WantsPicture { get; set; }
        public string? ImageKey { get; set; }
        public int Likes { get; set; }
    }

    private sealed record NewLike(long SubjectId, long UserId, DateTime At);

    private sealed class NewComment(long postId, Person author, string body, DateTime at, NewComment? parent)
    {
        public long Id { get; set; }
        public long PostId { get; } = postId;
        public Person Author { get; } = author;
        public string Body { get; } = body;
        public DateTime At { get; } = at;
        public NewComment? Parent { get; } = parent;
    }

    private sealed record NewFollow(long FollowerId, long FolloweeId, DateTime At);

    private sealed class NewConversation(Person one, Person other)
    {
        public long Id { get; set; }
        public Person One { get; } = one;
        public Person Other { get; } = other;
        public DateTime StartedAt { get; set; }
        public DateTime LastMessageAt { get; set; }
    }

    private sealed class NewMessage(NewConversation conversation, long senderId, string body, DateTime at, DateTime? readAt)
    {
        public long Id { get; set; }
        public NewConversation Conversation { get; } = conversation;
        public long SenderId { get; } = senderId;
        public string Body { get; } = body;
        public DateTime At { get; } = at;
        public DateTime? ReadAt { get; set; } = readAt;
    }

    /// <summary>Draws items in proportion to their weights.</summary>
    private sealed class WeightedPicker<T>
    {
        private readonly IReadOnlyList<T> _items;
        private readonly double[] _cumulative;
        private readonly Random _random;

        public WeightedPicker(IReadOnlyList<T> items, Func<T, double> weight, Random random)
        {
            _items = items;
            _random = random;
            _cumulative = new double[items.Count];
            var sum = 0.0;
            for (var i = 0; i < items.Count; i++)
            {
                sum += weight(items[i]);
                _cumulative[i] = sum;
            }
        }

        public T Next()
        {
            var target = _random.NextDouble() * _cumulative[^1];
            var index = Array.BinarySearch(_cumulative, target);
            return _items[index < 0 ? Math.Min(~index, _items.Count - 1) : index];
        }
    }
}
