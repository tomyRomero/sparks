namespace Sparks.Api.Storage.Services;

/// <summary>
/// The paths stored files are served at, by the API's <c>/files</c>
/// endpoint. The web app proxies the same path, so a URL in a response works
/// from either origin, whichever storage holds the file.
/// </summary>
public static class FileUrls
{
    public const string RoutePrefix = "files";

    /// <summary>The file's URL path; null when there's no file.</summary>
    public static string? Of(string? key) => key is null ? null : $"/{RoutePrefix}/{key}";
}
