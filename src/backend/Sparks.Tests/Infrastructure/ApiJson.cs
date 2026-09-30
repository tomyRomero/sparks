using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.Testing;
using Sparks.Api.Auth.Models;

namespace Sparks.Tests.Infrastructure;

/// <summary>Reads and writes JSON the way the API does (camelCase names, enums as names).</summary>
internal static class ApiJson
{
    public static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase, allowIntegerValues: false) },
    };

    public static Task<HttpResponseMessage> PostJsonAsync<T>(this HttpClient client, string url, T body, CancellationToken ct) =>
        client.PostAsJsonAsync(url, body, Options, ct);

    public static Task<HttpResponseMessage> PatchJsonAsync<T>(this HttpClient client, string url, T body, CancellationToken ct) =>
        client.PatchAsJsonAsync(url, body, Options, ct);

    public static async Task<T> ReadAsync<T>(this HttpResponseMessage response, CancellationToken ct) =>
        await response.Content.ReadFromJsonAsync<T>(Options, ct)
            ?? throw new InvalidOperationException("The response had no body.");

    public static async Task<T> GetJsonAsync<T>(this HttpClient client, string url, CancellationToken ct) =>
        await client.GetFromJsonAsync<T>(url, Options, ct)
            ?? throw new InvalidOperationException("The response had no body.");

    /// <summary>The machine-readable <c>code</c> of a problem-details response.</summary>
    public static async Task<string?> ProblemCodeAsync(this HttpResponseMessage response, CancellationToken ct) =>
        (await response.ReadAsync<JsonElement>(ct)).GetProperty("code").GetString();

    /// <summary>A client signed in as a brand-new account.</summary>
    public static async Task<(HttpClient Client, CurrentUserResponse User)> SignedInClientAsync(
        this WebApplicationFactory<Program> api, CancellationToken ct)
    {
        var client = api.CreateClient();
        var response = await client.SignUpAsync(AuthHelpers.NewAccount(), ct);
        response.EnsureSuccessStatusCode();
        return (client, await response.ReadAsync<CurrentUserResponse>(ct));
    }
}
