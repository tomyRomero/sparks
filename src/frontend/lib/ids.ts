/**
 * Whether a route parameter can be an API id (a positive 64-bit integer), so
 * a page can answer "not found" without asking the API about "abc".
 */
export function isId(value: string): boolean {
  return /^[1-9]\d{0,17}$/.test(value);
}
