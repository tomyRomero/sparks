using System.Net;
using FluentAssertions;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.SignalR.Client;
using Sparks.Api.Chat.Models;
using Sparks.Api.Realtime;
using Sparks.Tests.Infrastructure;

namespace Sparks.Tests.Realtime;

/// <summary>What the live connection pushes: messages, read receipts and typing.</summary>
public sealed class RealtimeTests(SparksApiFactory factory)
{
    private static readonly TimeSpan EventTimeout = TimeSpan.FromSeconds(10);

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task A_message_reaches_the_recipient_and_the_senders_other_tabs()
    {
        var chat = await ChatAsync();
        await using var bobLive = await ConnectAsync(chat.BobToken);
        await using var aliceOtherTab = await ConnectAsync(chat.AliceToken);
        var toBob = NextAsync<MessageResponse>(bobLive, nameof(IRealtimeClient.MessageReceived));
        var toAlice = NextAsync<MessageResponse>(aliceOtherTab, nameof(IRealtimeClient.MessageReceived));

        var sent = await SendAsync(chat.Alice, chat.ConversationId, "Are you there?");

        (await toBob).Should().BeEquivalentTo(sent);
        (await toAlice).Should().BeEquivalentTo(sent);
    }

    [Fact]
    public async Task Read_receipts_reach_the_sender()
    {
        var chat = await ChatAsync();
        var sent = await SendAsync(chat.Alice, chat.ConversationId, "Did you read this?");
        await using var aliceLive = await ConnectAsync(chat.AliceToken);
        var receipt = NextAsync<MessagesReadEvent>(aliceLive, nameof(IRealtimeClient.MessagesRead));

        (await chat.Bob.PostJsonAsync(
                $"/api/v1/conversations/{chat.ConversationId}/read", new MarkMessagesReadRequest { UpToMessageId = sent.Id }, Ct))
            .EnsureSuccessStatusCode();

        (await receipt).Should().BeEquivalentTo(new { chat.ConversationId, ReaderId = chat.BobId, UpToMessageId = sent.Id });
    }

    [Fact]
    public async Task Typing_reaches_only_the_other_participant()
    {
        var chat = await ChatAsync();
        var (_, _, outsiderToken) = await factory.SignedInWithTokenAsync(Ct);
        await using var aliceLive = await ConnectAsync(chat.AliceToken);
        await using var bobLive = await ConnectAsync(chat.BobToken);
        await using var outsiderLive = await ConnectAsync(outsiderToken);
        var bobSees = NextAsync<TypingEvent>(bobLive, nameof(IRealtimeClient.Typing));

        // The outsider's call finishes before Alice's starts, so if it had
        // reached Bob, its event would come first.
        await outsiderLive.InvokeAsync(nameof(RealtimeHub.Typing), chat.ConversationId, Ct);
        await aliceLive.InvokeAsync(nameof(RealtimeHub.Typing), chat.ConversationId, Ct);

        (await bobSees).Should().Be(new TypingEvent(chat.ConversationId, chat.AliceId));
    }

    [Fact]
    public async Task Connecting_requires_sign_in()
    {
        await using var connection = Connection(accessToken: null);

        var connect = () => connection.StartAsync(Ct);

        (await connect.Should().ThrowAsync<HttpRequestException>())
            .Which.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    /// <summary>Two new members, Alice and Bob, with a conversation between them.</summary>
    private async Task<Chat> ChatAsync()
    {
        var (alice, aliceUser, aliceToken) = await factory.SignedInWithTokenAsync(Ct);
        var (bob, bobUser, bobToken) = await factory.SignedInWithTokenAsync(Ct);
        var response = await alice.PostJsonAsync(
            "/api/v1/conversations", new StartConversationRequest { Username = bobUser.Username }, Ct);
        response.EnsureSuccessStatusCode();
        var conversation = await response.ReadAsync<ConversationResponse>(Ct);
        return new Chat(alice, aliceUser.Id, aliceToken, bob, bobUser.Id, bobToken, conversation.Id);
    }

    private async Task<HubConnection> ConnectAsync(string accessToken)
    {
        var connection = Connection(accessToken);
        await connection.StartAsync(Ct);
        return connection;
    }

    /// <summary>
    /// A hub connection through the in-memory test server. Long polling,
    /// because the test server's handler carries plain HTTP requests only.
    /// </summary>
    private HubConnection Connection(string? accessToken) =>
        new HubConnectionBuilder()
            .WithUrl(new Uri(factory.Server.BaseAddress, RealtimeHub.Path), options =>
            {
                options.Transports = HttpTransportType.LongPolling;
                options.HttpMessageHandlerFactory = _ => factory.Server.CreateHandler();
                options.AccessTokenProvider = () => Task.FromResult(accessToken);
            })
            .Build();

    /// <summary>The next event of one kind the connection receives.</summary>
    private static Task<T> NextAsync<T>(HubConnection connection, string eventName)
    {
        var received = new TaskCompletionSource<T>(TaskCreationOptions.RunContinuationsAsynchronously);
        connection.On<T>(eventName, payload => received.TrySetResult(payload));
        return received.Task.WaitAsync(EventTimeout, Ct);
    }

    private static async Task<MessageResponse> SendAsync(HttpClient sender, long conversationId, string body)
    {
        var response = await sender.PostJsonAsync(
            $"/api/v1/conversations/{conversationId}/messages", new SendMessageRequest { Body = body }, Ct);
        response.EnsureSuccessStatusCode();
        return await response.ReadAsync<MessageResponse>(Ct);
    }

    private sealed record Chat(
        HttpClient Alice, long AliceId, string AliceToken,
        HttpClient Bob, long BobId, string BobToken,
        long ConversationId);
}
