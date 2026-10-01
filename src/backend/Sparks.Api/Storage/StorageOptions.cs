using System.ComponentModel.DataAnnotations;

namespace Sparks.Api.Storage;

/// <summary>Configuration section <c>Storage</c>.</summary>
public sealed class StorageOptions
{
    public const string SectionName = "Storage";

    /// <summary>Where images live. A bucket unless set otherwise.</summary>
    public StorageProvider Provider { get; set; } = StorageProvider.S3;

    /// <summary>
    /// The folder <see cref="StorageProvider.Local"/> writes to, relative to
    /// the API's content root unless absolute. Kept out of git.
    /// </summary>
    [Required]
    public string LocalRoot { get; set; } = "App_Data/files";
}

public enum StorageProvider
{
    /// <summary>An S3-compatible bucket: Cloudflare R2, AWS S3, Backblaze B2 or MinIO.</summary>
    S3,

    /// <summary>A folder on the API's own disk, for tests and working offline.</summary>
    Local,
}

/// <summary>
/// The bucket (section <c>Storage:S3</c>). The access key pair lives in user
/// secrets, never in the repo.
/// </summary>
public sealed class S3StorageOptions
{
    public const string SectionName = "Storage:S3";

    /// <summary>The S3 endpoint; for R2, <c>https://&lt;account id&gt;.r2.cloudflarestorage.com</c>.</summary>
    [Required, Url]
    public string ServiceUrl { get; set; } = string.Empty;

    [Required]
    public string Bucket { get; set; } = string.Empty;

    [Required]
    public string AccessKeyId { get; set; } = string.Empty;

    [Required]
    public string SecretAccessKey { get; set; } = string.Empty;

    /// <summary>The signing region. R2 takes <c>auto</c>; AWS needs the bucket's own region.</summary>
    [Required]
    public string Region { get; set; } = "auto";
}
