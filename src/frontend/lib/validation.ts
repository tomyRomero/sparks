import { limits } from "./limits";

/**
 * The API's rules for what members type, checked as they type so a form
 * never has to round-trip to say a field is wrong. Each returns what's wrong
 * with a value, in words fit to show under the field, or undefined when
 * it's fine. The API checks everything again.
 */

/** Letters, digits and underscores, 3 to 30 of them (InputLimits.UsernamePattern). */
export function usernameProblem(value: string): string | undefined {
  if (value === "") return "Choose a username.";
  if (/[^A-Za-z0-9_]/.test(value)) return "Use only letters, digits and underscores.";
  if (value.length < limits.usernameMin) return `Use at least ${limits.usernameMin} characters.`;
  if (value.length > limits.usernameMax) return `Use ${limits.usernameMax} characters or fewer.`;
  return undefined;
}

/**
 * Something@something.something. A little stricter than the API, which only
 * wants one @ with text either side: an address with no dot after the @
 * is almost always a typo.
 */
export function emailProblem(value: string): string | undefined {
  const email = value.trim();
  if (email === "") return "Enter your email.";
  if (email.length > limits.emailMax) return `Use ${limits.emailMax} characters or fewer.`;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter an email like name@example.com.";
  return undefined;
}

export function displayNameProblem(value: string): string | undefined {
  const name = value.trim();
  if (name === "") return "Enter your name.";
  if (name.length > limits.displayNameMax) return `Use ${limits.displayNameMax} characters or fewer.`;
  return undefined;
}

/** A value's length in UTF-8 bytes, which is what BCrypt counts. */
export function utf8Length(value: string): number {
  return new TextEncoder().encode(value).length;
}

/** Each password rule and whether a value meets it, for a live checklist. */
export function passwordChecks(value: string) {
  return {
    longEnough: value.length >= limits.passwordMin,
    shortEnough: utf8Length(value) <= limits.passwordMaxBytes,
  };
}

export function passwordProblem(value: string): string | undefined {
  if (value === "") return "Enter a password.";
  const { longEnough, shortEnough } = passwordChecks(value);
  if (!longEnough) return `Use at least ${limits.passwordMin} characters.`;
  if (!shortEnough) return "That's too long. Use up to 72 letters and digits, or fewer with accents or emoji.";
  return undefined;
}

/** A field that only has to be filled in. */
export function requiredProblem(message: string) {
  return (value: string) => (value.trim() === "" ? message : undefined);
}
