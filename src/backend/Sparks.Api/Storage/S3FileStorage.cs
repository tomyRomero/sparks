using System.Net;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;

namespace Sparks.Api.Storage;

/// <summary>
/// Stores files in an S3-compatible bucket (Cloudflare R2, AWS S3, Backblaze
/// B2, MinIO). The bucket stays private: browsers get files from the API's
/// <c>/files</c> endpoint, which reads them from here.
/// </summary>
public sealed class S3FileStorage(IAmazonS3 s3, IOptions<S3StorageOptions> options) : IFileStorage
{
    private readonly string _bucket = options.Value.Bucket;

    // Cloudflare's guide for this SDK asks uploads to skip payload signing and
    // the default checksum: R2 doesn't support the streaming upload format
    // they otherwise switch on. The SDK allows an unsigned payload only over
    // HTTPS, where TLS protects the body anyway, so a plain-HTTP endpoint
    // (the test bucket) still signs it.
    private readonly bool _unsignedPayload =
        options.Value.ServiceUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase);

    /// <summary>A client for the bucket, set up to work with any S3-compatible store.</summary>
    public static IAmazonS3 CreateClient(S3StorageOptions bucket) =>
        new AmazonS3Client(
            new BasicAWSCredentials(bucket.AccessKeyId, bucket.SecretAccessKey),
            new AmazonS3Config
            {
                ServiceURL = bucket.ServiceUrl,
                AuthenticationRegion = bucket.Region,
                // bucket/key in the path rather than the host name, which every
                // S3-compatible store accepts.
                ForcePathStyle = true,
                // Checksums only where the S3 API requires them: the SDK's newer
                // defaults send headers other stores don't all accept.
                RequestChecksumCalculation = RequestChecksumCalculation.WHEN_REQUIRED,
                ResponseChecksumValidation = ResponseChecksumValidation.WHEN_REQUIRED,
            });

    public async Task SaveAsync(string key, Stream content, CancellationToken ct)
    {
        await s3.PutObjectAsync(
            new PutObjectRequest
            {
                BucketName = _bucket,
                Key = Checked(key),
                InputStream = content,
                AutoCloseStream = false,
                ContentType = StorageKeys.ContentType(key),
                DisablePayloadSigning = _unsignedPayload,
                DisableDefaultChecksumValidation = true,
            },
            ct);
    }

    public async Task<bool> ExistsAsync(string key, CancellationToken ct)
    {
        try
        {
            await s3.GetObjectMetadataAsync(_bucket, Checked(key), ct);
            return true;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            return false;
        }
    }

    public async Task<Stream?> OpenReadAsync(string key, CancellationToken ct)
    {
        try
        {
            var response = await s3.GetObjectAsync(_bucket, Checked(key), ct);
            return new ObjectStream(response);
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    /// <summary>S3 answers a delete of a missing key with success, so this is harmless too.</summary>
    public Task DeleteAsync(string key, CancellationToken ct) => s3.DeleteObjectAsync(_bucket, Checked(key), ct);

    /// <summary>The same rule as local storage: only keys <see cref="StorageKeys"/> could have made.</summary>
    private static string Checked(string key) =>
        StorageKeys.IsValid(key) ? key : throw new ArgumentException("Not a storage key.", nameof(key));

    /// <summary>
    /// An object's content, read straight from the bucket's HTTP response.
    /// Disposing it disposes the whole response, which releases the
    /// connection, so whoever reads it (the <c>/files</c> endpoint) needs to
    /// know nothing about S3.
    /// </summary>
    private sealed class ObjectStream(GetObjectResponse response) : Stream
    {
        private readonly Stream _body = response.ResponseStream;

        public override bool CanRead => true;
        public override bool CanSeek => false;
        public override bool CanWrite => false;
        public override long Length => throw new NotSupportedException();

        public override long Position
        {
            get => throw new NotSupportedException();
            set => throw new NotSupportedException();
        }

        public override int Read(byte[] buffer, int offset, int count) => _body.Read(buffer, offset, count);

        public override ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken cancellationToken = default) =>
            _body.ReadAsync(buffer, cancellationToken);

        public override Task<int> ReadAsync(byte[] buffer, int offset, int count, CancellationToken cancellationToken) =>
            _body.ReadAsync(buffer, offset, count, cancellationToken);

        public override void Flush()
        {
        }

        public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();

        public override void SetLength(long value) => throw new NotSupportedException();

        public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                response.Dispose();
            }

            base.Dispose(disposing);
        }
    }
}
