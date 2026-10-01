import type { SparkKind } from "@/lib/api/types";
import { excerpt } from "@/lib/text";

/**
 * A spark's text, split the way its kind is written. AI drafts follow these
 * shapes (SparkBriefs.cs in the API), and the composer suggests them to
 * anyone writing by hand. Text that doesn't follow them shows as written.
 */
export type SparkText = {
  /** A first line "Title: …", for movie scripts, book plots and artworks. */
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

/** A haiku's lines, without blank ones. */
export function haikuLines(body: string): string[] {
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * A one-line preview of a spark for tight spaces (an inbox row, a toast):
 * its title when it has one, and never a joke's punchline.
 */
export function sparkPreview(kind: SparkKind, body: string, max: number): string {
  const { title, text } = splitSpark(kind, body);
  return excerpt(title ?? text, max);
}
