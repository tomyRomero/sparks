using Sparks.Api.Common.Constants;

namespace Sparks.Api.Seeding;

public static class SeedingExtensions
{
    public const string PasswordSetting = "Seed:Password";

    /// <summary>
    /// <c>dotnet run -- seed</c>: fills a development database with demo data
    /// and exits. Every demo account gets the password in user secrets
    /// (<see cref="PasswordSetting"/>), which <c>scripts/setup-dev.sh</c> creates.
    /// </summary>
    public static async Task<int> SeedDemoDataAsync(this WebApplication app)
    {
        var logger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger(typeof(DemoSeeder));
        if (!app.Environment.IsDevelopment())
        {
            logger.LogError("Demo data can only be seeded in Development, never in {Environment}", app.Environment.EnvironmentName);
            return 1;
        }

        var password = app.Configuration[PasswordSetting];
        if (string.IsNullOrWhiteSpace(password) || password.Length < InputLimits.PasswordMinLength)
        {
            logger.LogError(
                "Set {Setting} (at least {MinLength} characters) in user secrets first; scripts/setup-dev.sh does it",
                PasswordSetting,
                InputLimits.PasswordMinLength);
            return 1;
        }

        await using var scope = app.Services.CreateAsyncScope();
        var seeder = ActivatorUtilities.CreateInstance<DemoSeeder>(scope.ServiceProvider);
        if (await seeder.RunAsync(password, app.Lifetime.ApplicationStopping))
        {
            logger.LogInformation(
                "Sign in as {Username} with the {Setting} from user secrets", DemoSeeder.MainUsername, PasswordSetting);
        }

        return 0;
    }
}
