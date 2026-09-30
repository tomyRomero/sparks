using System.ComponentModel.DataAnnotations;

namespace Sparks.Api.Storage;

/// <summary>Configuration section <c>Storage</c>.</summary>
public sealed class StorageOptions
{
    public const string SectionName = "Storage";

    /// <summary>
    /// The folder local storage writes to, relative to the API's content root
    /// unless absolute. Kept out of git.
    /// </summary>
    [Required]
    public string LocalRoot { get; set; } = "App_Data/files";
}
