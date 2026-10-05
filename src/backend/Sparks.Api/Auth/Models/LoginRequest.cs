using System.ComponentModel.DataAnnotations;
using Sparks.Api.Common.Constants;

namespace Sparks.Api.Auth.Models;

public sealed record LoginRequest
{
    /// <summary>The account's email or username.</summary>
    [Required, StringLength(InputLimits.EmailMaxLength)]
    public string Identifier { get; init; } = string.Empty;

    // No length rules beyond a sanity cap: a sign-in only checks the password,
    // and rejecting one for its shape would hint at the password policy.
    [Required, StringLength(1024)]
    public string Password { get; init; } = string.Empty;
}
