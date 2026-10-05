using System.Security.Cryptography;
using System.Text.Json;
using DotNet.Testcontainers.Builders;
using DotNet.Testcontainers.Containers;
using Sparks.Api.Storage;

namespace Sparks.Tests.Infrastructure;

/// <summary>
/// A throwaway S3 bucket (SeaweedFS) with a fresh key pair per run. It checks
/// signatures like R2 and refuses anonymous requests.
/// </summary>
public sealed class S3Bucket : IAsyncLifetime
{
    public const string Name = "sparks-tests";
    private const int S3Port = 8333;

    private readonly string _accessKeyId = $"sparks-tests-{Guid.NewGuid():N}";
    private readonly string _secretAccessKey = Convert.ToHexString(RandomNumberGenerator.GetBytes(24));
    private readonly IContainer _container;

    public S3Bucket()
    {
        var identities = JsonSerializer.SerializeToUtf8Bytes(new
        {
            identities = new[]
            {
                new
                {
                    name = "sparks-tests",
                    credentials = new[] { new { accessKey = _accessKeyId, secretKey = _secretAccessKey } },
                    actions = new[] { "Admin", "Read", "Write", "List" },
                },
            },
        });

        _container = new ContainerBuilder("chrislusf/seaweedfs:4.48")
            .WithResourceMapping(identities, "/etc/seaweedfs/s3.json")
            .WithCommand("mini", "-dir=/data", "-s3.config=/etc/seaweedfs/s3.json", $"-bucket={Name}", "-admin.ui=false")
            .WithPortBinding(S3Port, assignRandomHostPort: true)
            .WithWaitStrategy(Wait.ForUnixContainer()
                .UntilHttpRequestIsSucceeded(request => request.ForPort(S3Port).ForPath("/healthz")))
            .Build();
    }

    /// <summary>Settings for the bucket, as the API would read them; optionally with a wrong secret.</summary>
    public S3StorageOptions Settings(string? secretAccessKey = null) => new()
    {
        ServiceUrl = $"http://{_container.Hostname}:{_container.GetMappedPublicPort(S3Port)}",
        Bucket = Name,
        AccessKeyId = _accessKeyId,
        SecretAccessKey = secretAccessKey ?? _secretAccessKey,
    };

    public async ValueTask InitializeAsync() => await _container.StartAsync(TestContext.Current.CancellationToken);

    public ValueTask DisposeAsync() => _container.DisposeAsync();
}
