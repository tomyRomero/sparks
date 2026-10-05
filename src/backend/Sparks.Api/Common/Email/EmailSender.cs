namespace Sparks.Api.Common.Email;

public sealed record EmailMessage(string To, string Subject, string Body);

/// <summary>Sends email. A real provider plugs in here when Sparks is deployed.</summary>
public interface IEmailSender
{
    Task SendAsync(EmailMessage message, CancellationToken ct);
}

/// <summary>
/// Logs emails instead of sending them. The body (with its reset link) is
/// only logged in development; anywhere else it would be an account takeover.
/// </summary>
public sealed class LoggingEmailSender(IHostEnvironment environment, ILogger<LoggingEmailSender> logger) : IEmailSender
{
    public Task SendAsync(EmailMessage message, CancellationToken ct)
    {
        if (environment.IsDevelopment())
        {
            logger.LogInformation(
                "Email (not sent; development)\nTo: {To}\nSubject: {Subject}\n\n{Body}",
                message.To, message.Subject, message.Body);
        }
        else
        {
            logger.LogWarning("No email provider is configured; an email was dropped");
        }

        return Task.CompletedTask;
    }
}
