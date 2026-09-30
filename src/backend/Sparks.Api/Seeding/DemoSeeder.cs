using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Sparks.Api.Ai.Services;
using Sparks.Api.Auth.Services;
using Sparks.Api.Chat.Models;
using Sparks.Api.Chat.Services;
using Sparks.Api.Common.Data;
using Sparks.Api.Posts.Data;
using Sparks.Api.Posts.Models;
using Sparks.Api.Posts.Services;
using Sparks.Api.Realtime;
using Sparks.Api.Storage;
using Sparks.Api.Users.Data;

namespace Sparks.Api.Seeding;

/// <summary>
/// Fills a development database with two believable weeks of Sparks:
/// members, posts of every kind, threads, likes and chats. Everything but
/// the accounts goes through the real services, so it obeys the same rules
/// as what members write, while a movable clock spreads it over time.
/// Pictures come from whichever image provider is configured.
/// </summary>
public sealed class DemoSeeder(
    SparksDbContext db,
    IFileStorage storage,
    ImageUploadService images,
    IImageGenerator painter,
    IHubContext<RealtimeHub, IRealtimeClient> hub,
    TimeProvider realTime,
    ILogger<DemoSeeder> logger)
{
    /// <summary>The member to sign in as: the one with unread activity and messages.</summary>
    public const string MainUsername = "nova_reyes";

    private readonly SeedClock _clock = new(realTime.GetUtcNow());
    private PostService Posts => new(db, _clock, storage);
    private CommentService Comments => new(db, _clock);
    private ChatService Chat => new(db, _clock, hub);

    /// <summary>Seeds once; returns false when the demo members are already there.</summary>
    public async Task<bool> RunAsync(string password, CancellationToken ct)
    {
        if (await db.Users.AnyAsync(user => user.Username == MainUsername, ct))
        {
            logger.LogInformation("The demo data is already in this database");
            return false;
        }

        var passwordHash = Passwords.Hash(password);

        // ── Members, a month ago ────────────────────────────────────────────
        _clock.Ago(TimeSpan.FromDays(30));
        var nova = await MemberAsync(MainUsername, "Nova Reyes",
            "Screenwriter by night, barista by day. Collecting plot twists.", passwordHash, ct);
        var theo = await MemberAsync("theo_park", "Theo Park",
            "Landscape photographer. Chasing blue hour in every city.", passwordHash, ct);
        var amara = await MemberAsync("amara_okafor", "Amara Okafor",
            "Designer. Slow fashion and far too many sketchbooks.", passwordHash, ct);
        var lucas = await MemberAsync("lucas_meyer", "Lucas Meyer",
            "Backend developer who writes haiku while the build runs.", passwordHash, ct);
        var isla = await MemberAsync("isla_novak", "Isla Novak",
            "Reader of old maps, writer of new stories.", passwordHash, ct);
        var kenji = await MemberAsync("kenji_mori", "Kenji Mori",
            "Painter. Oil, ink and the occasional coffee stain.", passwordHash, ct);
        var sofia = await MemberAsync("sofia_ruiz", "Sofia Ruiz",
            "Stand-up on weekends. Every joke is tested on my cat first.", passwordHash, ct);
        var omar = await MemberAsync("omar_haddad", "Omar Haddad",
            "Philosophy graduate, professional overthinker.", passwordHash, ct);

        // ── Two weeks of posts, comments and likes ──────────────────────────
        _clock.Ago(TimeSpan.FromDays(14));
        var buildHaiku = await PostAsync(lucas, SparkKind.Haiku,
            "Green tests at midnight\nthe coffee has gone cold, but\nthe build is still warm", ct: ct);
        await LikeAsync(buildHaiku, ct, nova, omar, kenji);

        _clock.Ago(TimeSpan.FromDays(13));
        var bridge = await PostAsync(theo, SparkKind.Photography,
            "A lone cyclist crossing a rain-soaked bridge at blue hour, the city lights smeared across the " +
            "puddles. Shot at 35mm from low down, with a slow shutter that turns the traffic into ribbons of " +
            "red and white.",
            aiPrompt: "rainy bridge at blue hour",
            imagePrompt: "A cyclist crossing a rain-soaked city bridge at blue hour, lights reflected in puddles, long exposure, cinematic.",
            ct: ct);
        var novaOnBridge = await CommentAsync(bridge, nova, "This looks like the opening shot of a film.", ct);
        await ReplyAsync(novaOnBridge, theo, "Then it's yours. Credit me in the titles.", ct);
        await LikeAsync(bridge, ct, nova, amara, isla, kenji, lucas);

        _clock.Ago(TimeSpan.FromDays(12));
        var lastSignal = await PostAsync(nova, SparkKind.MovieScript,
            "Title: The Last Signal\n\nWhen a lighthouse keeper (Florence Pugh) picks up a radio station that " +
            "went off air in 1962, she and a sceptical engineer (Dev Patel) race an oncoming storm to find who " +
            "is still broadcasting, and why every song is addressed to her. As the night closes in, the signal " +
            "starts answering back.",
            aiPrompt: "a lighthouse keeper hears a radio station that went off air decades ago",
            imagePrompt: "A cinematic movie poster: a lighthouse on a rocky coast at night, its beam cutting through storm clouds, an old radio glowing in the window.",
            ct: ct);
        var chills = await CommentAsync(lastSignal, theo, "The radio answering back gave me chills. Is this the short film?", ct);
        await ReplyAsync(chills, nova, "It is! Shooting in spring if the weather cooperates.", ct);
        await CommentAsync(lastSignal, isla, "I would read this as a novel too.", ct);
        await LikeAsync(lastSignal, ct, theo, isla, sofia, omar, kenji, amara);

        _clock.Ago(TimeSpan.FromDays(11));
        var catReview = await PostAsync(sofia, SparkKind.Joke,
            "My cat reviewed my new set. Two stars: \"Not enough tuna references.\"", ct: ct);
        await LikeAsync(catReview, ct, nova, lucas, omar);

        _clock.Ago(TimeSpan.FromDays(10));
        var tideCoat = await PostAsync(amara, SparkKind.Fashion,
            "A long charcoal wool coat with a sharp shoulder and a lining of hand-printed tide charts, over a " +
            "sea-glass green knit and wide trousers. Inspired by harbour workers at first light.",
            aiPrompt: "workwear from a fishing harbour, made elegant",
            imagePrompt: "A fashion editorial photo on a foggy harbour at dawn: a model in a long charcoal coat with a tide-chart lining, sea-glass green knit.",
            ct: ct);
        await LikeAsync(tideCoat, ct, nova, isla, kenji);

        _clock.Ago(TimeSpan.FromDays(9.5));
        var decide = await PostAsync(omar, SparkKind.Aphorism, "We don't find time. We decide what it's for.", ct: ct);
        await LikeAsync(decide, ct, nova, lucas, amara, theo);

        _clock.Ago(TimeSpan.FromDays(9));
        var atlas = await PostAsync(isla, SparkKind.BookPlot,
            "Title: The Cartographer's Daughter\n\nMira inherits her father's unfinished atlas and finds a " +
            "coastline no ship has ever charted. To finish his last map she must sail to it, and learn why " +
            "every sailor who went before came home with blank pages.",
            aiPrompt: "a girl finishes her late father's atlas",
            imagePrompt: "An illustrated book cover: a small sailing boat on a glassy sea under a sky filled with faint hand-drawn map lines.",
            ct: ct);
        await CommentAsync(atlas, nova, "\"Came home with blank pages\" is such a hook.", ct);
        await LikeAsync(atlas, ct, nova, omar, amara);

        _clock.Ago(TimeSpan.FromDays(8));
        var tideClock = await PostAsync(kenji, SparkKind.Artwork,
            "\"Tide Clock\", oil on linen. A kitchen clock half-sunk in a calm sea at dawn, its hands made of " +
            "driftwood and gulls resting on the numbers. The quiet feeling of time that has stopped rushing.",
            aiPrompt: "time slowing down by the sea",
            imagePrompt: "A surreal oil painting of a kitchen clock sinking into a calm sea at dawn, driftwood hands, gulls resting on its numbers.",
            ct: ct);
        var driftwood = await CommentAsync(tideClock, amara, "The driftwood hands!", ct);
        await ReplyAsync(driftwood, kenji, "Collected them on the beach where I grew up.", ct);
        await LikeAsync(tideClock, ct, nova, amara, theo, isla, sofia);

        _clock.Ago(TimeSpan.FromDays(7));
        var secondDraft = await PostAsync(nova, SparkKind.Regular,
            "Finished the second draft of my short film today. 38 pages, 3 coffees, 1 existential crisis. " +
            "Table read on Friday: who wants to play a sarcastic lighthouse?", ct: ct);
        var sarcastic = await CommentAsync(secondDraft, sofia, "I can do a very sarcastic lighthouse. Years of practice.", ct);
        await ReplyAsync(sarcastic, nova, "You're hired.", ct);
        await CommentAsync(secondDraft, omar, "What was the existential crisis about? Asking for a friend.", ct);
        await LikeAsync(secondDraft, ct, sofia, theo, isla, lucas);

        _clock.Ago(TimeSpan.FromDays(6));
        var codeReview = await PostAsync(lucas, SparkKind.Regular,
            "Hot take: the best code review comment is a question, not an instruction.", ct: ct);
        await CommentAsync(codeReview, omar, "Socrates would have made a great reviewer.", ct);
        await LikeAsync(codeReview, ct, omar, nova, amara);

        _clock.Ago(TimeSpan.FromDays(5));
        var question = await PostAsync(omar, SparkKind.Quote,
            "A question asked honestly is already half an answer.",
            aiPrompt: "honest questions", ct: ct);
        await LikeAsync(question, ct, lucas, isla);

        _clock.Ago(TimeSpan.FromDays(4));
        var harbour = await PostAsync(theo, SparkKind.Photography,
            "An old fisherman mending nets in a doorway, lit only by the sun sliding through a gap in the " +
            "roof. 85mm, shallow focus, dust hanging in the light.",
            aiPrompt: "quiet work in morning light",
            imagePrompt: "An old fisherman mending nets in a dark doorway, a single shaft of morning sun, dust in the air, 85mm portrait, warm tones.",
            ct: ct);
        await LikeAsync(harbour, ct, kenji, amara, nova);

        _clock.Ago(TimeSpan.FromDays(3));
        var seventhTime = await PostAsync(nova, SparkKind.Haiku,
            "Script pages scattered\nthe lighthouse scene rewritten\nfor the seventh time",
            aiPrompt: "rewriting the same scene again", ct: ct);

        // Nova last opened her activity here; everything after is unread.
        await MarkActivityReadAsync(nova, ct);

        _clock.Ago(TimeSpan.FromDays(2.8));
        await CommentAsync(seventhTime, lucas, "Seventh time is the charm. Mine is usually the fourteenth build.", ct);
        await LikeAsync(seventhTime, ct, lucas, sofia, theo);

        _clock.Ago(TimeSpan.FromDays(2));
        var studio = await PostAsync(kenji, SparkKind.Regular,
            "Opening my studio this Saturday for the first time. Tea, paint-stained tables, and every canvas " +
            "that didn't make it into the show.", ct: ct);
        await CommentAsync(studio, nova, "I'll bring pastries.", ct);
        await LikeAsync(studio, ct, nova, amara, theo, isla);

        _clock.Ago(TimeSpan.FromDays(1.5));
        var buttons = await PostAsync(amara, SparkKind.Regular,
            "Swapped every plastic button in the new collection for coconut shell. Small change, big difference.", ct: ct);
        await LikeAsync(buttons, ct, kenji, isla);

        _clock.Ago(TimeSpan.FromDays(1));
        var barista = await PostAsync(sofia, SparkKind.Joke,
            "I asked the barista for something strong. She handed me the Wi-Fi password.",
            aiPrompt: "coffee shops", ct: ct);
        await CommentAsync(barista, nova, "As a barista: this is accurate.", ct);
        await LikeAsync(barista, ct, nova, lucas, omar, theo);

        _clock.Ago(TimeSpan.FromHours(6));
        var geese = await PostAsync(isla, SparkKind.Regular,
            "Found a 1910 map of my city at a flea market. Half the streets have different names and one is " +
            "just labelled \"here be geese\".", ct: ct);
        await LikeAsync(geese, ct, nova, omar, kenji);

        _clock.Ago(TimeSpan.FromHours(3));
        var tableRead = await PostAsync(nova, SparkKind.Regular,
            "Table read tomorrow! Thank you to everyone who volunteered to be the lighthouse.", ct: ct);
        await CommentAsync(tableRead, sofia, "The lighthouse has been rehearsing. The lighthouse is ready.", ct);
        await LikeAsync(tableRead, ct, sofia, theo, isla, kenji);
        await LikeAsync(secondDraft, ct, amara);

        // ── Chats with Nova ─────────────────────────────────────────────────
        await ConversationAsync(nova, theo, ct,
            (TimeSpan.FromDays(5), theo, "Found three lighthouses within an hour of the city. Want location photos?"),
            (TimeSpan.FromDays(5) - TimeSpan.FromMinutes(20), nova, "Yes please! The one with the red door, if it exists."),
            (TimeSpan.FromDays(4.9), theo, "It exists. I'll shoot it at blue hour on Sunday."),
            (TimeSpan.FromDays(4.8), nova, "You're the best."));
        await ConversationAsync(nova, isla, ct,
            (TimeSpan.FromDays(2), isla, "Would you ever turn The Last Signal into a novella?"),
            (TimeSpan.FromDays(1.9), nova, "Only if you write the map at the front."),
            (TimeSpan.FromHours(5), isla, "Deal. I already sketched the coastline."));
        await ConversationAsync(nova, sofia, ct,
            (TimeSpan.FromDays(1), nova, "Table read is at 7. Bring your best lighthouse voice."),
            (TimeSpan.FromHours(20), sofia, "Should the lighthouse have an accent?"),
            (TimeSpan.FromHours(19), nova, "Absolutely not."),
            (TimeSpan.FromHours(2), sofia, "It's going to have an accent."),
            (TimeSpan.FromHours(1), sofia, "Also, I'm bringing my cat. She has notes."));

        logger.LogInformation("Seeded demo data: 8 members with posts, threads, likes and chats");
        return true;
    }

    private async Task<Member> MemberAsync(
        string username, string displayName, string bio, string passwordHash, CancellationToken ct)
    {
        var user = new UserEntity
        {
            Username = username,
            DisplayName = displayName,
            Email = $"{username}@sparks.test",
            PasswordHash = passwordHash,
            Bio = bio,
            CreatedAt = _clock.GetUtcNow().UtcDateTime,
        };
        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        user.AvatarKey = await PaintAsync(
            $"A friendly illustrated avatar for {displayName}, {bio}", StorageKeys.Avatars, user.Id, ct);
        await db.SaveChangesAsync(ct);
        return new Member(user.Id, username);
    }

    private async Task<long> PostAsync(
        Member author, SparkKind kind, string body, CancellationToken ct, string? aiPrompt = null, string? imagePrompt = null)
    {
        var imageKey = imagePrompt is null ? null : await PaintAsync(imagePrompt, StorageKeys.Images, author.Id, ct);
        var post = await Posts.CreateAsync(
            author.Id,
            new CreatePostRequest { Kind = kind, Body = body, AiPrompt = aiPrompt, ImageKey = imageKey },
            ct);
        _clock.Later(TimeSpan.FromMinutes(20));
        return post.Id;
    }

    private async Task<long> CommentAsync(long postId, Member author, string body, CancellationToken ct)
    {
        var comment = await Comments.CommentOnPostAsync(postId, author.Id, new CommentRequest { Body = body }, ct);
        _clock.Later(TimeSpan.FromMinutes(15));
        return comment.Id;
    }

    private async Task ReplyAsync(long commentId, Member author, string body, CancellationToken ct)
    {
        await Comments.ReplyAsync(commentId, author.Id, new CommentRequest { Body = body }, ct);
        _clock.Later(TimeSpan.FromMinutes(15));
    }

    private async Task LikeAsync(long postId, CancellationToken ct, params Member[] fans)
    {
        foreach (var fan in fans)
        {
            await Posts.LikeAsync(postId, fan.Id, ct);
            _clock.Later(TimeSpan.FromMinutes(7));
        }
    }

    private async Task MarkActivityReadAsync(Member member, CancellationToken ct)
    {
        DateTime? readAt = _clock.GetUtcNow().UtcDateTime;
        await db.Users
            .Where(user => user.Id == member.Id)
            .ExecuteUpdateAsync(set => set.SetProperty(user => user.ActivityReadAt, readAt), ct);
    }

    /// <summary>
    /// A conversation between the main member and someone else. Whoever
    /// sends a message has read everything before it, so what's left unread
    /// is what came after each one's last reply.
    /// </summary>
    private async Task ConversationAsync(
        Member main, Member other, CancellationToken ct, params (TimeSpan Ago, Member From, string Body)[] messages)
    {
        _clock.Ago(messages[0].Ago);
        var (conversation, _) = await Chat.OpenAsync(main.Id, other.Username, ct);
        long? lastMessageId = null;
        foreach (var (ago, from, body) in messages)
        {
            _clock.Ago(ago);
            if (lastMessageId is { } previous)
            {
                await Chat.MarkReadAsync(conversation.Id, from.Id, previous, ct);
            }

            var sent = await Chat.SendAsync(conversation.Id, from.Id, new SendMessageRequest { Body = body }, ct);
            lastMessageId = sent.Id;
        }
    }

    private async Task<string> PaintAsync(string prompt, string folder, long ownerId, CancellationToken ct)
    {
        var bytes = await painter.GenerateAsync(prompt, ct);
        await using var content = new MemoryStream(bytes, writable: false);
        return await images.SaveAsync(content, folder, ownerId, ct);
    }

    private sealed record Member(long Id, string Username);

    /// <summary>A clock the seeder moves, so seeded content spreads over past weeks.</summary>
    private sealed class SeedClock(DateTimeOffset realNow) : TimeProvider
    {
        private readonly DateTimeOffset _realNow = realNow;
        private DateTimeOffset _current = realNow;

        public override DateTimeOffset GetUtcNow() => _current;

        /// <summary>Sets the clock to a time before the real now.</summary>
        public void Ago(TimeSpan ago) => _current = _realNow - ago;

        public void Later(TimeSpan step) => _current += step;
    }
}
