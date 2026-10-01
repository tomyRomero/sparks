/** A positive 64-bit integer, so pages can 404 on "abc" without asking the API. */
export function isId(value: string): boolean {
  return /^[1-9]\d{0,17}$/.test(value);
}
