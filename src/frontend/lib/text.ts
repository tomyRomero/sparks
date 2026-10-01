/** The first line, cut at a word with an ellipsis past `max`. */
export function excerpt(text: string, max: number): string {
  const line = text.replace(/\s+/g, " ").trim();
  if (line.length <= max) return line;
  const cut = line.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  // Cut at the last word break unless that throws away most of the text.
  return `${(lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export type TextPart = { text: string; match: boolean };

/**
 * Splits text around each place a search term appears, ignoring case as the
 * API's search does, so the matches can be highlighted.
 */
export function matchParts(text: string, term: string): TextPart[] {
  const wanted = term.trim();
  if (!wanted) return [{ text, match: false }];
  const pattern = new RegExp(`(${wanted.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "giu");
  return text
    .split(pattern)
    .map((part, index) => ({ text: part, match: index % 2 === 1 }))
    .filter((part) => part.text !== "");
}
