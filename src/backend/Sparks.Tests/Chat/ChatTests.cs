using System.Net;
using System.Text.Json;
using FluentAssertions;
using Sparks.Api.Chat.Models;
using Sparks.Api.Common.Models;
using Sparks.Api.Posts.Data;
using Sparks.Tests.Infrastructure;

namespace Sparks.Tests.Chat;

/// <summary>Private conversations: opening them, messages, sharing sparks, the inbox and read state.</summary>
public sealed class ChatTests(SparksApiFactory factory)
{
    private const string ConversationsPath = "/api/v1/conversations";

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task A_conversation_is_created_once_per_pair_whoever_opens_it()
    {
        var (alice, aliceUser) = await factory.SignedInClientAsync(Ct);
        var (bob, bobUser) = await factory.SignedInClientAsync(Ct);

        var first = await alice.PostJsonAsync(ConversationsPath, new StartConversationRequest { Username = bobUser.Username }, Ct);
        var again = await alice.PostJsonAsync(ConversationsPath, new StartConversationRequest { Username = bobUser.Username }, Ct);
        var fromBob = await bob.PostJsonAsync(ConversationsPath, new StartConversationRequest { Username = aliceUser.Username }, Ct);

        first.StatusCode.Should().Be(HttpStatusCode.Created);
        again.StatusCode.Should().Be(HttpStatusCode.OK);
        fromBob.StatusCode.Should().Be(HttpStatusCode.OK);
        var conversation = await first.ReadAsync<ConversationResponse>(Ct);
        conversation.Should().BeEquivalentTo(new
        {
            With = new { bobUser.Id, bobUser.Username },
            LastMessage = (MessageResponse?)null,
            UnreadCount = 0,
        });
        (await again.ReadAsync<ConversationResponse>(Ct)).Id.Should().Be(conversation.Id);
        var bobsView = await fromBob.ReadAsync<ConversationResponse>(Ct);
        bobsView.Id.Should().Be(conversation.Id);
        bobsView.With.Id.Should().Be(aliceUser.Id);
    }

    [Fact]
    public async Task Opening_a_conversation_needs_another_existing_member()
    {
        var (alice, aliceUser) = await factory.SignedInClientAsync(Ct);

        var withSelf = await alice.PostJsonAsync(ConversationsPath, new StartConversationRequest { Username = aliceUser.Username }, Ct);
        var withNobody = await alice.PostJsonAsync(
            ConversationsPath, new StartConversationRequest { Username = TestData.UniqueUsername() }, Ct);
        var anonymous = await factory.CreateClient().PostJsonAsync(
            ConversationsPath, new StartConversationRequest { Username = aliceUser.Username }, Ct);

        withSelf.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await withSelf.ProblemCodeAsync(Ct)).Should().Be("CANNOT_MESSAGE_YOURSELF");
        withNobody.StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await withNobody.ProblemCodeAsync(Ct)).Should().Be("USER_NOT_FOUND");
        anonymous.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Messages_list_newest_first_with_a_cursor()
    {
        var (alice, bob, conversationId) = await ConversationAsync();
        var sent = new List<MessageResponse>();
        foreach (var text in new[] { "  Hi Bob  ", "How are you?", "Still there?" })
        {
            sent.Add(await SendAsync(alice, conversationId, text));
        }

        var first = await bob.GetJsonAsync<CursorPage<MessageResponse>>(MessagesPath(conversationId) + "?limit=2", Ct);
        var second = await bob.GetJsonAsync<CursorPage<MessageResponse>>(
            MessagesPath(conversationId) + $"?limit=2&cursor={first.NextCursor}", Ct);

        sent[0].Body.Should().Be("Hi Bob");
        first.Items.Select(message => message.Id).Should().Equal(sent[2].Id, sent[1].Id);
        second.Items.Should().ContainSingle().Which.Id.Should().Be(sent[0].Id);
        second.NextCursor.Should().BeNull();
    }

    [Fact]
    public async Task A_blank_message_is_refused()
    {
        var (alice, _, conversationId) = await ConversationAsync();

        var response = await alice.PostJsonAsync(MessagesPath(conversationId), new SendMessageRequest { Body = "  " }, Ct);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var problem = await response.ReadAsync<JsonElement>(Ct);
        problem.GetProperty("errors").EnumerateObject().Select(error => error.Name).Should().Equal("body");
    }

    [Fact]
    public async Task A_message_can_share_a_spark_with_or_without_words()
    {
        var (alice, bob, conversationId) = await ConversationAsync();
        var (author, authorUser) = await factory.SignedInClientAsync(Ct);
        var spark = await author.CreatePostAsync(
            "Title: The Last Signal\n\nA lighthouse keeper hears a station that went off air.", SparkKind.MovieScript, Ct);

        var bare = await SendAsync(alice, conversationId, new SendMessageRequest { SharedPostId = spark.Id });
        var withWords = await SendAsync(
            alice, conversationId, new SendMessageRequest { Body = "You'll love this", SharedPostId = spark.Id });

        bare.Body.Should().BeEmpty();
        bare.SharedPost.Should().BeEquivalentTo(new
        {
            spark.Id,
            Kind = SparkKind.MovieScript,
            spark.Body,
            Author = new { authorUser.Id, authorUser.Username },
        });
        withWords.Body.Should().Be("You'll love this");
        withWords.SharedPost!.Id.Should().Be(spark.Id);
        var messages = await bob.GetJsonAsync<CursorPage<MessageResponse>>(MessagesPath(conversationId), Ct);
        messages.Items.Should().OnlyContain(message => message.SharedPost!.Id == spark.Id);
        var inbox = await bob.GetJsonAsync<OpaqueCursorPage<ConversationResponse>>(ConversationsPath, Ct);
        inbox.Items.Single(conversation => conversation.Id == conversationId).LastMessage!.SharedPost!.Id
            .Should().Be(spark.Id);
    }

    [Fact]
    public async Task A_long_shared_spark_comes_as_its_opening()
    {
        var (alice, _, conversationId) = await ConversationAsync();
        var spark = await alice.CreatePostAsync(new string('a', 400) + new string('b', 100), Ct);

        var message = await SendAsync(alice, conversationId, new SendMessageRequest { SharedPostId = spark.Id });

        message.SharedPost!.Body.Should().Be(new string('a', SharedSparkResponse.ExcerptLength));
    }

    [Fact]
    public async Task Sharing_a_spark_that_doesnt_exist_is_refused()
    {
        var (alice, _, conversationId) = await ConversationAsync();

        var response = await alice.PostJsonAsync(
            MessagesPath(conversationId), new SendMessageRequest { SharedPostId = long.MaxValue }, Ct);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await response.ProblemCodeAsync(Ct)).Should().Be("POST_NOT_FOUND");
    }

    [Fact]
    public async Task Deleting_a_shared_spark_keeps_the_message_without_it()
    {
        var (alice, bob, conversationId) = await ConversationAsync();
        var spark = await alice.CreatePostAsync("Soon to be gone.", Ct);
        var shared = await SendAsync(alice, conversationId, new SendMessageRequest { SharedPostId = spark.Id });

        (await alice.DeleteAsync($"/api/v1/posts/{spark.Id}", Ct)).EnsureSuccessStatusCode();

        var messages = await bob.GetJsonAsync<CursorPage<MessageResponse>>(MessagesPath(conversationId), Ct);
        messages.Items.Should().ContainSingle().Which.Should().BeEquivalentTo(
            new { shared.Id, Body = "", SharedPost = (SharedSparkResponse?)null },
            "an empty message with no spark tells the app the shared spark is gone");
    }

    [Fact]
    public async Task Each_participant_gets_the_conversation_from_their_side()
    {
        var (alice, aliceUser) = await factory.SignedInClientAsync(Ct);
        var (bob, conversationId) = await OpenWithNewMemberAsync(alice);
        var sent = await SendAsync(alice, conversationId, "Hello Bob");

        var bobsView = await bob.GetJsonAsync<ConversationResponse>($"{ConversationsPath}/{conversationId}", Ct);
        var alicesView = await alice.GetJsonAsync<ConversationResponse>($"{ConversationsPath}/{conversationId}", Ct);

        bobsView.Should().BeEquivalentTo(new
        {
            Id = conversationId,
            With = new { aliceUser.Id, aliceUser.Username },
            LastMessage = new { sent.Id, sent.Body },
            UnreadCount = 1,
        });
        alicesView.With.Id.Should().NotBe(aliceUser.Id);
        alicesView.UnreadCount.Should().Be(0, "her own messages are never unread for her");
    }

    [Fact]
    public async Task Outsiders_cant_see_that_a_conversation_exists()
    {
        var (alice, _, conversationId) = await ConversationAsync();
        await SendAsync(alice, conversationId, "Just between us");
        var (outsider, _) = await factory.SignedInClientAsync(Ct);

        var open = await outsider.GetAsync($"{ConversationsPath}/{conversationId}", Ct);
        var read = await outsider.GetAsync(MessagesPath(conversationId), Ct);
        var write = await outsider.PostJsonAsync(MessagesPath(conversationId), new SendMessageRequest { Body = "Hi" }, Ct);
        var markRead = await outsider.PostJsonAsync(
            $"{ConversationsPath}/{conversationId}/read", new MarkMessagesReadRequest { UpToMessageId = long.MaxValue }, Ct);

        foreach (var response in new[] { open, read, write, markRead })
        {
            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
            (await response.ProblemCodeAsync(Ct)).Should().Be("CONVERSATION_NOT_FOUND");
        }
    }

    [Fact]
    public async Task The_inbox_puts_the_latest_conversation_first_and_skips_empty_ones()
    {
        var (me, _) = await factory.SignedInClientAsync(Ct);
        var withAnn = await OpenWithNewMemberAsync(me);
        var withBen = await OpenWithNewMemberAsync(me);
        await OpenWithNewMemberAsync(me);

        await SendAsync(withAnn.Them, withAnn.ConversationId, "Hello from Ann");
        await SendAsync(withBen.Them, withBen.ConversationId, "Hello from Ben");
        var latest = await SendAsync(withAnn.Them, withAnn.ConversationId, "Ann again");

        var inbox = await me.GetJsonAsync<OpaqueCursorPage<ConversationResponse>>(ConversationsPath, Ct);

        inbox.Items.Select(conversation => conversation.Id).Should().Equal(withAnn.ConversationId, withBen.ConversationId);
        inbox.Items[0].LastMessage.Should().BeEquivalentTo(latest);
        inbox.Items[0].UnreadCount.Should().Be(2);
        inbox.Items[1].UnreadCount.Should().Be(1);
    }

    [Fact]
    public async Task The_inbox_pages_with_an_opaque_cursor()
    {
        var (me, _) = await factory.SignedInClientAsync(Ct);
        for (var i = 0; i < 3; i++)
        {
            var (them, conversationId) = await OpenWithNewMemberAsync(me);
            await SendAsync(them, conversationId, $"Message {i}");
        }

        var first = await me.GetJsonAsync<OpaqueCursorPage<ConversationResponse>>($"{ConversationsPath}?limit=2", Ct);
        var second = await me.GetJsonAsync<OpaqueCursorPage<ConversationResponse>>(
            $"{ConversationsPath}?limit=2&cursor={Uri.EscapeDataString(first.NextCursor!)}", Ct);
        var forged = await me.GetAsync($"{ConversationsPath}?cursor=abc", Ct);

        first.Items.Should().HaveCount(2);
        second.Items.Should().ContainSingle();
        second.Items.Select(conversation => conversation.Id).Should().NotIntersectWith(first.Items.Select(conversation => conversation.Id));
        second.NextCursor.Should().BeNull();
        forged.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await forged.ProblemCodeAsync(Ct)).Should().Be("INVALID_CURSOR");
    }

    [Fact]
    public async Task Marking_read_covers_messages_up_to_the_one_seen()
    {
        var (alice, bob, conversationId) = await ConversationAsync();
        await SendAsync(alice, conversationId, "First");
        var seen = await SendAsync(alice, conversationId, "Second");
        var unseen = await SendAsync(alice, conversationId, "Sent while Bob was reading");

        var before = await UnreadCountAsync(bob);
        await MarkReadAsync(bob, conversationId, seen.Id);
        await MarkReadAsync(alice, conversationId, unseen.Id);
        var messages = await bob.GetJsonAsync<CursorPage<MessageResponse>>(MessagesPath(conversationId), Ct);

        before.Should().Be(3);
        (await UnreadCountAsync(bob)).Should().Be(1);
        messages.Items.Select(message => message.ReadAt is not null).Should().Equal(
            [false, true, true], "only Bob can mark Alice's messages read, and only up to the one he saw");
    }

    private async Task<(HttpClient Alice, HttpClient Bob, long ConversationId)> ConversationAsync()
    {
        var (alice, _) = await factory.SignedInClientAsync(Ct);
        var (bob, conversationId) = await OpenWithNewMemberAsync(alice);
        return (alice, bob, conversationId);
    }

    /// <summary>Signs up a new member and opens a conversation with them from <paramref name="me"/>.</summary>
    private async Task<(HttpClient Them, long ConversationId)> OpenWithNewMemberAsync(HttpClient me)
    {
        var (them, themUser) = await factory.SignedInClientAsync(Ct);
        var response = await me.PostJsonAsync(ConversationsPath, new StartConversationRequest { Username = themUser.Username }, Ct);
        response.EnsureSuccessStatusCode();
        return (them, (await response.ReadAsync<ConversationResponse>(Ct)).Id);
    }

    private static string MessagesPath(long conversationId) => $"{ConversationsPath}/{conversationId}/messages";

    private static Task<MessageResponse> SendAsync(HttpClient sender, long conversationId, string body) =>
        SendAsync(sender, conversationId, new SendMessageRequest { Body = body });

    private static async Task<MessageResponse> SendAsync(HttpClient sender, long conversationId, SendMessageRequest message)
    {
        var response = await sender.PostJsonAsync(MessagesPath(conversationId), message, Ct);
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        return await response.ReadAsync<MessageResponse>(Ct);
    }

    private static async Task MarkReadAsync(HttpClient reader, long conversationId, long upToMessageId) =>
        (await reader.PostJsonAsync(
                $"{ConversationsPath}/{conversationId}/read", new MarkMessagesReadRequest { UpToMessageId = upToMessageId }, Ct))
            .EnsureSuccessStatusCode();

    private static async Task<int> UnreadCountAsync(HttpClient client) =>
        (await client.GetJsonAsync<UnreadMessages>($"{ConversationsPath}/unread-count", Ct)).Count;
}
