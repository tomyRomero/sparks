using Amazon.S3;
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
    [Fact]
    public void Without_a_provider_setting_images_go_to_a_bucket()
    {
        var services = Register([]);

        StorageType(services).Should().Be<S3FileStorage>();
    }

    [Theory]
    [InlineData("S3", typeof(S3FileStorage))]
    [InlineData("Local", typeof(LocalFileStorage))]
    public void The_provider_setting_picks_the_storage(string provider, Type storage)
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

    [Fact]
    public void Local_storage_needs_no_bucket()
    {
        var services = Register(new() { ["Storage:Provider"] = "Local" });

        services.Should().NotContain(service => service.ServiceType == typeof(IAmazonS3));
        services.Should().NotContain(service => service.ServiceType == typeof(IConfigureOptions<S3StorageOptions>));
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
