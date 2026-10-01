using System.Net;
using System.Text.Json;
using FluentAssertions;
using Sparks.Api.Common.Models;
using Sparks.Api.Posts.Data;
using Sparks.Api.Posts.Models;
using Sparks.Api.Users.Models;
using Sparks.Tests.Infrastructure;

namespace Sparks.Tests.Users;

/// <summary>Profile pages, the lists on them, editing your own, and finding members.</summary>
public sealed class ProfileTests(SparksApiFactory factory)
{
    private const string UsersPath = "/api/v1/users";

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task A_profile_shows_public_details_and_counts_but_never_the_email()
    {
        var (member, user) = await factory.SignedInClientAsync(Ct);
        var (fan, _) = await factory.SignedInClientAsync(Ct);
        var liked = await member.CreatePostAsync("Popular", Ct);
        await member.CreatePostAsync("Quiet", Ct);
        await fan.PutAsync($"/api/v1/posts/{liked.Id}/like", content: null, Ct);

        var response = await factory.CreateClient().GetAsync($"{UsersPath}/{user.Username.ToUpperInvariant()}", Ct);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var json = await response.ReadAsync<JsonElement>(Ct);
        json.TryGetProperty("email", out _).Should().BeFalse();
        json.Deserialize<ProfileResponse>(ApiJson.Options).Should().BeEquivalentTo(new
        {
            user.Id,
            user.Username,
            user.DisplayName,
            Bio = (string?)null,
            PostCount = 2,
            LikesReceived = 1,
            CommentCount = 0,
            PictureCount = 0,
            CoverUrl = (string?)null,
        });
    }

    [Fact]
    public async Task A_profile_shows_its_most_liked_picture_on_top_and_lists_its_pictures()
    {
        var (member, user) = await factory.SignedInClientAsync(Ct);
        var (fan, _) = await factory.SignedInClientAsync(Ct);
        var older = await member.CreatePictureAsync("Low tide", SparkKind.Photography, Ct);
        var newer = await member.CreatePictureAsync("High noon", SparkKind.Photography, Ct);
        await member.CreatePostAsync("No picture", Ct);
        await member.CommentAsync(older.Id, "My own note", Ct);
        await fan.PutAsync($"/api/v1/posts/{older.Id}/like", content: null, Ct);
        var reader = factory.CreateClient();

        var profile = await reader.GetJsonAsync<ProfileResponse>($"{UsersPath}/{user.Username}", Ct);
        var pictures = await reader.GetJsonAsync<CursorPage<PostResponse>>(
            $"{UsersPath}/{user.Username}/posts?pictures=true", Ct);

        profile.Should().BeEquivalentTo(new { PostCount = 3, PictureCount = 2, CommentCount = 1, CoverUrl = older.ImageUrl });
        pictures.Items.Select(post => post.Id).Should().Equal(newer.Id, older.Id);
    }

    [Theory]
    [InlineData("")]
    [InlineData("/posts")]
    [InlineData("/comments")]
    [InlineData("/liked")]
    [InlineData("/followers")]
    [InlineData("/following")]
    public async Task An_unknown_username_is_a_404_with_a_code(string list)
    {
        var response = await factory.CreateClient().GetAsync($"{UsersPath}/{TestData.UniqueUsername()}{list}", Ct);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await response.ProblemCodeAsync(Ct)).Should().Be("USER_NOT_FOUND");
    }

    [Fact]
    public async Task A_profile_lists_the_members_own_posts_comments_and_likes_newest_first()
    {
        var (member, user) = await factory.SignedInClientAsync(Ct);
        var (other, _) = await factory.SignedInClientAsync(Ct);
        var othersPost = await other.CreatePostAsync("Someone else's", Ct);
        var firstPost = await member.CreatePostAsync("My first", Ct);
        var secondPost = await member.CreatePostAsync("My second", Ct);
        var comment = await member.CommentAsync(othersPost.Id, "Nice", Ct);
        var reply = await member.ReplyAsync(comment.Id, "Adding to that", Ct);
        await other.CommentAsync(firstPost.Id, "Not the member's", Ct);
        await member.PutAsync($"/api/v1/posts/{othersPost.Id}/like", content: null, Ct);
        await member.PutAsync($"/api/v1/posts/{firstPost.Id}/like", content: null, Ct);
        var reader = factory.CreateClient();

        var posts = await reader.GetJsonAsync<CursorPage<PostResponse>>($"{UsersPath}/{user.Username}/posts", Ct);
        var comments = await reader.GetJsonAsync<CursorPage<CommentResponse>>($"{UsersPath}/{user.Username}/comments", Ct);
        var likedPosts = await reader.GetJsonAsync<CursorPage<PostResponse>>($"{UsersPath}/{user.Username}/liked", Ct);

        posts.Items.Select(post => post.Id).Should().Equal(secondPost.Id, firstPost.Id);
        comments.Items.Select(c => c.Id).Should().Equal(reply.Id, comment.Id);
        likedPosts.Items.Select(post => post.Id).Should().Equal(firstPost.Id, othersPost.Id);
    }

    [Fact]
    public async Task Members_edit_their_own_name_and_bio()
    {
        var (member, user) = await factory.SignedInClientAsync(Ct);

        var edited = await (await member.PatchJsonAsync(
                $"{UsersPath}/me", new UpdateProfileRequest { DisplayName = "  New Name ", Bio = " Writes haiku. " }, Ct))
            .ReadAsync<ProfileResponse>(Ct);
        var bioCleared = await (await member.PatchJsonAsync(
                $"{UsersPath}/me", new UpdateProfileRequest { DisplayName = "New Name", Bio = "   " }, Ct))
            .ReadAsync<ProfileResponse>(Ct);

        edited.Should().BeEquivalentTo(new { user.Username, DisplayName = "New Name", Bio = "Writes haiku." });
        bioCleared.Bio.Should().BeNull();
        var shown = await factory.CreateClient().GetJsonAsync<ProfileResponse>($"{UsersPath}/{user.Username}", Ct);
        shown.DisplayName.Should().Be("New Name");
    }

    [Fact]
    public async Task Editing_a_profile_requires_sign_in_and_a_display_name()
    {
        var (member, _) = await factory.SignedInClientAsync(Ct);

        var anonymous = await factory.CreateClient().PatchJsonAsync(
            $"{UsersPath}/me", new UpdateProfileRequest { DisplayName = "Nobody" }, Ct);
        var blankName = await member.PatchJsonAsync($"{UsersPath}/me", new UpdateProfileRequest { DisplayName = " " }, Ct);

        anonymous.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        blankName.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var problem = await blankName.ReadAsync<JsonElement>(Ct);
        problem.GetProperty("errors").EnumerateObject().Select(error => error.Name).Should().Contain("displayName");
    }

    [Fact]
    public async Task Search_finds_members_by_username_or_display_name_but_not_the_searcher()
    {
        var (searcher, self) = await factory.SignedInClientAsync(Ct);
        var (_, byUsername) = await factory.SignedInClientAsync(Ct);
        var (renamed, byDisplayName) = await factory.SignedInClientAsync(Ct);
        var nickname = $"Nick{Guid.NewGuid():N}"[..20];
        await renamed.PatchJsonAsync($"{UsersPath}/me", new UpdateProfileRequest { DisplayName = nickname }, Ct);

        var usernameHits = await searcher.GetJsonAsync<CursorPage<UserSummary>>(
            $"{UsersPath}?q={byUsername.Username.ToUpperInvariant()}", Ct);
        var displayNameHits = await searcher.GetJsonAsync<CursorPage<UserSummary>>(
            $"{UsersPath}?q={nickname.ToLowerInvariant()}", Ct);
        var selfHits = await searcher.GetJsonAsync<CursorPage<UserSummary>>($"{UsersPath}?q={self.Username}", Ct);

        usernameHits.Items.Should().ContainSingle().Which.Id.Should().Be(byUsername.Id);
        displayNameHits.Items.Should().ContainSingle().Which.Id.Should().Be(byDisplayName.Id);
        selfHits.Items.Should().BeEmpty();
    }
}
