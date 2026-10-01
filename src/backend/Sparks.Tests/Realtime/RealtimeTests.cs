using System.Net;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR.Client;
using Sparks.Api.Chat.Models;
using Sparks.Api.Realtime;
using Sparks.Tests.Infrastructure;

namespace Sparks.Tests.Realtime;

/// <summary>What the live connection pushes: messages, read receipts and typing.</summary>
public sealed class RealtimeTests(SparksApiFactory factory)
{
    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task A_message_reaches_the_recipient_and_the_senders_other_tabs()
    {
        var chat = await ChatAsync();
        await using var bobLive = await factory.ConnectLiveAsync(chat.BobToken, Ct);
        await using var aliceOtherTab = await factory.ConnectLiveAsync(chat.AliceToken, Ct);
        var toBob = bobLive.NextAsync<MessageResponse>(nameof(IRealtimeClient.MessageReceived), Ct);
        var toAlice = aliceOtherTab.NextAsync<MessageResponse>(nameof(IRealtimeClient.MessageReceived), Ct);

        var sent = await SendAsync(chat.Alice, chat.ConversationId, "Are you there?");

        (await toBob).Should().BeEquivalentTo(sent);
        (await toAlice).Should().BeEquivalentTo(sent);
    }

    [Fact]
    public async Task Read_receipts_reach_the_sender()
    {
        var chat = await ChatAsync();
        var sent = await SendAsync(chat.Alice, chat.ConversationId, "Did you read this?");
        await using var aliceLive = await factory.ConnectLiveAsync(chat.AliceToken, Ct);
        var receipt = aliceLive.NextAsync<MessagesReadEvent>(nameof(IRealtimeClient.MessagesRead), Ct);

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
        await using var aliceLive = await factory.ConnectLiveAsync(chat.AliceToken, Ct);
        await using var bobLive = await factory.ConnectLiveAsync(chat.BobToken, Ct);
        await using var outsiderLive = await factory.ConnectLiveAsync(outsiderToken, Ct);
        var bobSees = bobLive.NextAsync<TypingEvent>(nameof(IRealtimeClient.Typing), Ct);

        // The outsider's call finishes before Alice's starts, so if it had
        // reached Bob, its event would come first.
        await outsiderLive.InvokeAsync(nameof(RealtimeHub.Typing), chat.ConversationId, Ct);
        await aliceLive.InvokeAsync(nameof(RealtimeHub.Typing), chat.ConversationId, Ct);

        (await bobSees).Should().Be(new TypingEvent(chat.ConversationId, chat.AliceId));
    }

    [Fact]
    public async Task Connecting_requires_sign_in()
    {
        await using var connection = factory.LiveConnection(accessToken: null);

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
