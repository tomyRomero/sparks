/**
 * Where to go after signing in. Only a path on this site is accepted, so a
 * crafted link can't bounce a member to another site ("//evil.example"
 * would be protocol-relative).
 */
export function safeReturnPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return "/";
  }
  return next;
}
