// Mirrors InputLimits.cs.
export const limits = {
  usernameMin: 3,
  usernameMax: 30,
  displayNameMax: 50,
  bioMax: 1000,
  emailMax: 254,
  passwordMin: 8,
  /** BCrypt reads only the first 72 bytes, so the API turns down longer passwords. */
  passwordMaxBytes: 72,
  postBodyMax: 10_000,
  aiPromptMax: 1000,
  commentBodyMax: 2000,
  messageBodyMax: 2000,
  /** PostFilters.MaxQueryLength, for search. */
  searchMax: 100,
} as const;

/** InputLimits.UsernamePattern. */
export const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,30}$/;
