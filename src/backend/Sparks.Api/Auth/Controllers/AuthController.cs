using System.Globalization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Sparks.Api.Auth.Models;
using Sparks.Api.Auth.Services;
using Sparks.Api.Common.Data;
using Sparks.Api.Common.Http;
using Sparks.Api.Common.Security;

namespace Sparks.Api.Auth.Controllers;

/// <summary>
/// Sign-up, sign-in, token refresh and sign-out. Tokens travel only in
/// HttpOnly cookies; response bodies carry the user, never a token.
/// </summary>
[ApiController]
[Route("api/v1/auth")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class AuthController(
    AuthService auth,
    PasswordResetService passwordResets,
    AuthCookies cookies,
    TimeProvider time) : ControllerBase
{
    [HttpPost("signup")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.Signup)]
    [ProducesResponseType<CurrentUserResponse>(StatusCodes.Status201Created)]
    public async Task<IActionResult> SignUp(SignupRequest request, CancellationToken ct)
    {
        try
        {
            var signedIn = await auth.SignUpAsync(request, ClientInfo.From(HttpContext), ct);
            cookies.Write(Response, signedIn);
            return StatusCode(StatusCodes.Status201Created, CurrentUserResponse.From(signedIn.User));
        }
        catch (AccountConflictException ex) when (ex.Field == AccountConflictException.UsernameField)
        {
            return this.CodedProblem(StatusCodes.Status409Conflict, "USERNAME_TAKEN", "That username is taken.");
        }
        catch (AccountConflictException)
        {
            return this.CodedProblem(
                StatusCodes.Status409Conflict, "EMAIL_TAKEN", "An account with that email already exists.");
        }
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.Login)]
    [ProducesResponseType<CurrentUserResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken ct)
    {
        try
        {
            var signedIn = await auth.SignInAsync(request, ClientInfo.From(HttpContext), ct);
            cookies.Write(Response, signedIn);
            return Ok(CurrentUserResponse.From(signedIn.User));
        }
        catch (AccountLockedException ex)
        {
            var retryAfter = Math.Max(1, (int)Math.Ceiling((ex.LockedUntil - time.GetUtcNow()).TotalSeconds));
            Response.Headers.RetryAfter = retryAfter.ToString(CultureInfo.InvariantCulture);
            return this.CodedProblem(
                StatusCodes.Status423Locked,
                "ACCOUNT_LOCKED",
                "Too many failed sign-in attempts. Try again later or reset your password.");
        }
        catch (UnauthorizedAccessException)
        {
            return this.CodedProblem(
                StatusCodes.Status401Unauthorized, "INVALID_CREDENTIALS", "Email, username or password is incorrect.");
        }
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.Passive)]
    [ProducesResponseType<CurrentUserResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Refresh(CancellationToken ct)
    {
        if (Request.Cookies[AuthCookies.RefreshToken] is not { Length: > 0 } refreshToken)
        {
            return this.CodedProblem(StatusCodes.Status401Unauthorized, "NOT_SIGNED_IN", "You are not signed in.");
        }

        try
        {
            var signedIn = await auth.RefreshAsync(refreshToken, ct);
            cookies.Write(Response, signedIn);
            return Ok(CurrentUserResponse.From(signedIn.User));
        }
        catch (UnauthorizedAccessException)
        {
            cookies.Delete(Response);
            return this.CodedProblem(
                StatusCodes.Status401Unauthorized, "SESSION_EXPIRED", "Your session has ended. Sign in again.");
        }
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.Passive)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        if (Request.Cookies[AuthCookies.RefreshToken] is { Length: > 0 } refreshToken)
        {
            await auth.SignOutAsync(refreshToken, ct);
        }

        cookies.Delete(Response);
        return NoContent();
    }

    /// <summary>
    /// Emails a reset link when the address has an account. Always answers 202,
    /// so the endpoint can't be used to find out who has an account.
    /// </summary>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.Login)]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request, CancellationToken ct)
    {
        await passwordResets.RequestResetAsync(request.Email, ct);
        return Accepted();
    }

    /// <summary>Sets a new password from an emailed link and signs the account out everywhere.</summary>
    [HttpPost("reset-password")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.Login)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request, CancellationToken ct)
    {
        try
        {
            await passwordResets.ResetPasswordAsync(request.Token, request.Password, ct);
            cookies.Delete(Response);
            return NoContent();
        }
        catch (InvalidResetTokenException)
        {
            return this.CodedProblem(
                StatusCodes.Status400BadRequest,
                "INVALID_RESET_LINK",
                "This reset link is invalid or has expired. Request a new one.");
        }
    }

    /// <summary>The signed-in user.</summary>
    [HttpGet("me")]
    [ProducesResponseType<CurrentUserResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Me([FromServices] SparksDbContext db, CancellationToken ct)
    {
        var userId = User.GetUserId();
        var user = await db.Users.AsNoTracking().SingleOrDefaultAsync(u => u.Id == userId, ct);
        return user is null
            ? this.CodedProblem(StatusCodes.Status401Unauthorized, "NOT_SIGNED_IN", "You are not signed in.")
            : Ok(CurrentUserResponse.From(user));
    }
}
