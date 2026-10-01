/** Same-site paths only, so a crafted link can't redirect elsewhere ("//evil.example"). */
export function safeReturnPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return "/";
  }
  return next;
}
