using System.ComponentModel.DataAnnotations;
using Sparks.Api.Common.Constants;
using Sparks.Api.Common.Validation;

namespace Sparks.Api.Auth.Models;

public sealed record ForgotPasswordRequest
{
    [Required, EmailAddress, StringLength(InputLimits.EmailMaxLength)]
    public string Email { get; init; } = string.Empty;
}

public sealed record ResetPasswordRequest
{
    /// <summary>The token from the emailed link.</summary>
    [Required, StringLength(100)]
    public string Token { get; init; } = string.Empty;

    [Required, MinLength(InputLimits.PasswordMinLength), MaxUtf8Bytes(InputLimits.PasswordMaxBytes)]
    public string Password { get; init; } = string.Empty;
}
