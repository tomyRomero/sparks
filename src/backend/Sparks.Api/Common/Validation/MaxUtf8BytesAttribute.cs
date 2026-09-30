using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Sparks.Api.Common.Validation;

/// <summary>
/// Limits a string by its UTF-8 size rather than its character count, for
/// values whose consumer counts bytes (BCrypt reads only the first 72).
/// </summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Parameter)]
public sealed class MaxUtf8BytesAttribute(int maxBytes)
    : ValidationAttribute($"The {{0}} field must be at most {maxBytes} bytes.")
{
    public int MaxBytes { get; } = maxBytes;

    public override bool IsValid(object? value) =>
        value is not string text || Encoding.UTF8.GetByteCount(text) <= MaxBytes;
}
