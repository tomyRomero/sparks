namespace Sparks.Api.Common.Email;

public sealed record EmailMessage(string To, string Subject, string Body);

/// <summary>Sends email. A real provider plugs in here when Sparks is deployed.</summary>
public interface IEmailSender
{
    Task SendAsync(EmailMessage message, CancellationToken ct);
}

/// <summary>
/// Writes emails to the log instead of sending them. Only local development
/// logs the content: emails carry single-use links (password resets), and a
/// link in a deployed environment's logs would let anyone who can read the
/// logs take over the account.
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
