using System.ComponentModel.DataAnnotations;
using Sparks.Api.Common.Constants;
using Sparks.Api.Common.Validation;

namespace Sparks.Api.Auth.Models;

public sealed record SignupRequest
{
    [Required, EmailAddress, StringLength(InputLimits.EmailMaxLength)]
    public string Email { get; init; } = string.Empty;

    [Required, RegularExpression(InputLimits.UsernamePattern, ErrorMessage = InputLimits.UsernamePatternMessage)]
    public string Username { get; init; } = string.Empty;

    [Required, StringLength(InputLimits.DisplayNameMaxLength)]
    public string DisplayName { get; init; } = string.Empty;

    [Required, MinLength(InputLimits.PasswordMinLength), MaxUtf8Bytes(InputLimits.PasswordMaxBytes)]
    public string Password { get; init; } = string.Empty;
}
