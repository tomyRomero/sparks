using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Sparks.Api.Storage;
using Sparks.Api.Storage.Services;

namespace Sparks.Tests.Storage;

/// <summary>How the <c>Storage</c> settings choose where images live. No containers involved.</summary>
public sealed class StorageSettingsTests
{
    [Theory]
    [InlineData(null, typeof(S3FileStorage))]
    [InlineData("Local", typeof(LocalFileStorage))]
    public void Images_go_to_a_bucket_unless_the_provider_setting_says_otherwise(string? provider, Type storage)
    {
        var services = Register(new() { ["Storage:Provider"] = provider });

        StorageType(services).Should().Be(storage);
    }

    [Fact]
    public void A_bucket_missing_its_settings_is_refused_when_the_app_starts()
    {
        var services = Register(new() { ["Storage:Provider"] = "S3", ["Storage:S3:Bucket"] = "sparks" });
        using var provider = services.BuildServiceProvider();

        var read = () => provider.GetRequiredService<IOptions<S3StorageOptions>>().Value;

        read.Should().Throw<OptionsValidationException>()
            .Which.Message.Should().Contain("ServiceUrl").And.Contain("AccessKeyId").And.Contain("SecretAccessKey")
            .And.NotContain("Bucket");
    }

    private static ServiceCollection Register(Dictionary<string, string?> settings)
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(settings).Build();
        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(configuration);
        services.AddSparksStorage(configuration);
        return services;
    }

    private static Type? StorageType(ServiceCollection services) =>
        services.Single(service => service.ServiceType == typeof(IFileStorage)).ImplementationType;
}
