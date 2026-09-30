namespace Sparks.Api.Common;

/// <summary>
/// Environment checks that decide when security defaults must be strict.
/// </summary>
public static class HostEnvironmentExtensions
{
    /// <summary>Name of the environment the integration tests run the API under.</summary>
    public const string Testing = "Testing";

    /// <summary>
    /// True for any deployed environment. Only local development and the test
    /// host are exempt, so a new environment name (staging, preview) is hardened
    /// by default rather than forgotten.
    /// </summary>
    public static bool IsRealEnvironment(this IHostEnvironment environment) =>
        !environment.IsDevelopment() && !environment.IsEnvironment(Testing);
}
