namespace Sparks.Api.Common.Constants;

/// <summary>
/// Length limits shared by the database schema and request validation, so a
/// value the API accepts always fits its column.
/// </summary>
public static class InputLimits
{
    public const int UsernameMinLength = 3;
    public const int UsernameMaxLength = 30;
    public const int DisplayNameMaxLength = 50;
    public const int BioMaxLength = 1000;

    public const int PostBodyMaxLength = 10_000;
    public const int AiPromptMaxLength = 1000;
    public const int CommentBodyMaxLength = 2000;
    public const int MessageBodyMaxLength = 2000;

    /// <summary>Key of a stored file (image), resolved to a URL by the storage provider.</summary>
    public const int StorageKeyMaxLength = 300;
}
