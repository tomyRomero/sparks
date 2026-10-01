import type { SparkKind } from "@/lib/api/types";
import { excerpt } from "@/lib/text";

// Splits a spark by its kind's layout (see SparkBriefs.cs). Text that
// doesn't follow it shows as written.
export type SparkText = {
  /** A first line "Title: ...", for movie scripts, book plots and artworks. */
  title: string | null;
  /** The rest of the text; for a joke, the setup. */
  text: string;
  /** For a joke, what follows the first blank line. */
  punchline: string | null;
};

const titledKinds: ReadonlySet<SparkKind> = new Set<SparkKind>(["movieScript", "bookPlot", "artwork"]);

export function splitSpark(kind: SparkKind, body: string): SparkText {
  if (titledKinds.has(kind)) {
    const titled = /^Title:[ \t]*(\S.*?)[ \t]*(?:\n+([\s\S]*))?$/.exec(body.trim());
    if (titled) return { title: titled[1], text: (titled[2] ?? "").trim(), punchline: null };
  }

  if (kind === "joke") {
    const joke = /^([\s\S]+?)\n[ \t]*\n([\s\S]+)$/.exec(body.trim());
    if (joke) return { title: null, text: joke[1].trim(), punchline: joke[2].trim() };
  }

  return { title: null, text: body.trim(), punchline: null };
}

export function haikuLines(body: string): string[] {
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** One-line preview: the title if any, never a joke's punchline. */
export function sparkPreview(kind: SparkKind, body: string, max: number): string {
  const { title, text } = splitSpark(kind, body);
  return excerpt(title ?? text, max);
}
