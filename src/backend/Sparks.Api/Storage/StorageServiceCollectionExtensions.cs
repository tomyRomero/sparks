namespace Sparks.Api.Storage;

public static class StorageServiceCollectionExtensions
{
    /// <summary>Image storage on local disk, and the checks uploads go through.</summary>
    public static IServiceCollection AddSparksStorage(this IServiceCollection services)
    {
        services.AddOptions<StorageOptions>()
            .BindConfiguration(StorageOptions.SectionName)
            .ValidateDataAnnotations()
            .ValidateOnStart();
        services.AddSingleton<IFileStorage, LocalFileStorage>();
        services.AddScoped<ImageUploadService>();
        return services;
    }
}
