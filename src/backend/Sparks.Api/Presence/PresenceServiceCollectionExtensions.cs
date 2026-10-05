using Sparks.Api.Presence.Services;

namespace Sparks.Api.Presence;

public static class PresenceServiceCollectionExtensions
{
    /// <summary>The connection counts, the service the hub and API use, and the sweep that marks members offline.</summary>
    public static IServiceCollection AddSparksPresence(this IServiceCollection services)
    {
        services.AddOptions<PresenceOptions>()
            .BindConfiguration(PresenceOptions.SectionName)
            .ValidateDataAnnotations()
            .ValidateOnStart();
        services.AddSingleton<PresenceTracker>();
        services.AddScoped<PresenceService>();
        services.AddHostedService<PresenceSweeper>();
        return services;
    }
}
