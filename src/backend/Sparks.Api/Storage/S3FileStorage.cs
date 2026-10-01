using System.Net;
using System.Runtime.CompilerServices;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;

namespace Sparks.Api.Storage;

/// <summary>
/// Any S3-compatible bucket (R2, S3, B2, MinIO). The bucket stays private;
/// browsers get files through the API's <c>/files</c> endpoint.
/// </summary>
public sealed class S3FileStorage(IAmazonS3 s3, IOptions<S3StorageOptions> options) : IFileStorage
{
    private readonly string _bucket = options.Value.Bucket;

    // R2 doesn't support the SDK's streaming upload format, so skip payload
    // signing (HTTPS only; the plain-HTTP test bucket still signs).
    private readonly bool _unsignedPayload =
        options.Value.ServiceUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase);

    public static IAmazonS3 CreateClient(S3StorageOptions bucket) =>
        new AmazonS3Client(
            new BasicAWSCredentials(bucket.AccessKeyId, bucket.SecretAccessKey),
            new AmazonS3Config
            {
                ServiceURL = bucket.ServiceUrl,
                AuthenticationRegion = bucket.Region,
                ForcePathStyle = true,
                // The SDK's newer checksum defaults aren't supported everywhere.
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

    public Task DeleteAsync(string key, CancellationToken ct) => s3.DeleteObjectAsync(_bucket, Checked(key), ct);

    public async IAsyncEnumerable<StoredFile> ListAsync(string folder, [EnumeratorCancellation] CancellationToken ct)
    {
        var request = new ListObjectsV2Request { BucketName = _bucket, Prefix = folder + "/" };
        ListObjectsV2Response page;
        do
        {
            page = await s3.ListObjectsV2Async(request, ct);
            foreach (var item in page.S3Objects ?? [])
            {
                if (StorageKeys.IsValid(item.Key) && item.LastModified is { } storedAt)
                {
                    yield return new StoredFile(item.Key, storedAt.ToUniversalTime());
                }
            }

            request.ContinuationToken = page.NextContinuationToken;
        }
        while (page.IsTruncated == true);
    }

    private static string Checked(string key) =>
        StorageKeys.IsValid(key) ? key : throw new ArgumentException("Not a storage key.", nameof(key));

    /// <summary>Disposes the whole S3 response with the stream, releasing the connection.</summary>
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
