using Microsoft.Extensions.Options;

namespace Sparks.Api.Storage;

public static class StorageServiceCollectionExtensions
{
    /// <summary>
    /// Image storage as configured under <c>Storage</c>, and the checks uploads
    /// go through. A bucket's settings are checked when the app starts, and
    /// only when a bucket is the chosen storage.
    /// </summary>
    public static IServiceCollection AddSparksStorage(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<StorageOptions>()
            .BindConfiguration(StorageOptions.SectionName)
            .ValidateDataAnnotations()
            .ValidateOnStart();

        var choice = configuration.GetSection(StorageOptions.SectionName).Get<StorageOptions>() ?? new StorageOptions();
        if (choice.Provider == StorageProvider.S3)
        {
            services.AddOptions<S3StorageOptions>()
                .BindConfiguration(S3StorageOptions.SectionName)
                .ValidateDataAnnotations()
                .ValidateOnStart();
            services.AddSingleton(provider =>
                S3FileStorage.CreateClient(provider.GetRequiredService<IOptions<S3StorageOptions>>().Value));
            services.AddSingleton<IFileStorage, S3FileStorage>();
        }
        else
        {
            services.AddSingleton<IFileStorage, LocalFileStorage>();
        }

        services.AddScoped<ImageUploadService>();
        return services;
    }
}
