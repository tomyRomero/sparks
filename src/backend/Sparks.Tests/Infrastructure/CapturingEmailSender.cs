using System.Collections.Concurrent;
using System.Text.RegularExpressions;
using Sparks.Api.Common.Email;

namespace Sparks.Tests.Infrastructure;

/// <summary>Keeps sent emails in memory so a test can read them.</summary>
internal sealed partial class CapturingEmailSender : IEmailSender
{
    private readonly ConcurrentQueue<EmailMessage> _sent = new();

    public IReadOnlyCollection<EmailMessage> Sent => _sent;

    public Task SendAsync(EmailMessage message, CancellationToken ct)
    {
        _sent.Enqueue(message);
        return Task.CompletedTask;
    }

    /// <summary>The reset token from the latest email to <paramref name="address"/>.</summary>
    public string ResetTokenFor(string address)
    {
        var email = _sent.Last(message => message.To == address);
        return ResetLink().Match(email.Body).Groups["token"].Value;
    }

    [GeneratedRegex(@"reset-password\?token=(?<token>[A-Za-z0-9_\-]+)")]
    private static partial Regex ResetLink();
}
