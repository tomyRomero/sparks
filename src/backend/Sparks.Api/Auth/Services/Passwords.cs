namespace Sparks.Api.Auth.Services;

/// <summary>BCrypt password hashing.</summary>
public static class Passwords
{
    /// <summary>About a quarter of a second per hash on current hardware.</summary>
    private const int WorkFactor = 12;

    // Checked against when an account doesn't exist, so a failed sign-in takes
    // the same time whether or not the email is registered.
    private static readonly Lazy<string> _unknownAccountHash =
        new(() => BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString(), WorkFactor));

    public static string Hash(string password) => BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);

    /// <summary>
    /// True when the password matches the hash. A null hash (no such account)
    /// still costs a full BCrypt check, and returns false.
    /// </summary>
    public static bool Verify(string password, string? hash)
    {
        if (hash is null)
        {
            BCrypt.Net.BCrypt.Verify(password, _unknownAccountHash.Value);
            return false;
        }

        return BCrypt.Net.BCrypt.Verify(password, hash);
    }
}
