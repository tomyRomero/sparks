using Sparks.Api.Ai.Providers;
using Sparks.Api.Ai.Services;

namespace Sparks.Api.Ai;

public static class AiServiceCollectionExtensions
{
    /// <summary>
    /// The providers configured under <c>Ai</c>. Only the chosen ones need
    /// their keys, which are checked when the app starts rather than on the
    /// first request.
    /// </summary>
    public static IServiceCollection AddSparksAi(this IServiceCollection services, IConfiguration configuration)
    {
        var choice = configuration.GetSection(AiOptions.SectionName).Get<AiOptions>() ?? new AiOptions();

        if (choice.TextProvider == AiTextProvider.Gemini)
        {
            services.AddOptions<GeminiOptions>()
                .BindConfiguration(GeminiOptions.SectionName)
                .ValidateDataAnnotations()
                .ValidateOnStart();
            services.AddHttpClient<ISparkWriter, GeminiSparkWriter>(http =>
            {
                http.BaseAddress = new Uri(GeminiSparkWriter.BaseAddress);
                http.Timeout = TimeSpan.FromSeconds(60);
            });
        }
        else
        {
            services.AddSingleton<ISparkWriter, SampleSparkWriter>();
        }

        if (choice.ImageProvider == AiImageProvider.Cloudflare)
        {
            services.AddOptions<CloudflareAiOptions>()
                .BindConfiguration(CloudflareAiOptions.SectionName)
                .ValidateDataAnnotations()
                .ValidateOnStart();
            services.AddHttpClient<IImageGenerator, CloudflareImageGenerator>(http =>
            {
                http.BaseAddress = new Uri(CloudflareImageGenerator.BaseAddress);
                http.Timeout = TimeSpan.FromSeconds(90);
            });
        }
        else
        {
            services.AddSingleton<IImageGenerator, SampleImageGenerator>();
        }

        services.AddScoped<AiService>();
        return services;
    }
}
