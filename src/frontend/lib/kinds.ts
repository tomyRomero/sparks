import {
  BookOpen,
  Camera,
  Clapperboard,
  Feather,
  Laugh,
  Lightbulb,
  Palette,
  PenLine,
  Quote,
  Shirt,
  type LucideIcon,
} from "lucide-react";
import type { SparkKind } from "@/lib/api/types";

export type KindInfo = {
  kind: SparkKind;
  /** Sentence case, as the mono labels show it. */
  label: string;
  icon: LucideIcon;
  /** What the composer asks for with AI help. */
  prompt: string;
  /** Whether AI drafts of this kind come with a picture. */
  visual: boolean;
  /** How its card lays it out, for the composer. */
  blurb: string;
  /** Stand-in text the composer's preview shows until something is written. */
  sample: string;
};

export const kinds: KindInfo[] = [
  {
    kind: "regular",
    label: "Spark",
    icon: PenLine,
    prompt: "",
    visual: false,
    blurb: "Words as you write them, with a picture if you like.",
    sample: "What's on your mind? Your words show up here as you write them.",
  },
  {
    kind: "movieScript",
    label: "Movie script",
    icon: Clapperboard,
    prompt: "An outline for a film",
    visual: true,
    blurb: "The title across a poster, then the logline in typewriter type.",
    sample: "Title: Your Title\n\nThe logline: who wants what, and what stands in the way.",
  },
  {
    kind: "bookPlot",
    label: "Book plot",
    icon: BookOpen,
    prompt: "An outline for a novel",
    visual: true,
    blurb: "A cover beside the title and the blurb from the back.",
    sample: "Title: Your Title\n\nThe blurb from the back cover: the world, the trouble, the stakes.",
  },
  {
    kind: "artwork",
    label: "Artwork",
    icon: Palette,
    prompt: "An idea for a piece of art",
    visual: true,
    blurb: "The piece, tall and framed, with its title and a note.",
    sample: "Title: Your Piece\n\nWhat it shows, and how it's made.",
  },
  {
    kind: "fashion",
    label: "Fashion",
    icon: Shirt,
    prompt: "An idea for a look",
    visual: true,
    blurb: "A square picture of the look, then what makes it.",
    sample: "The look: the pieces, the colours, the feeling.",
  },
  {
    kind: "photography",
    label: "Photography",
    icon: Camera,
    prompt: "An idea for a photo",
    visual: true,
    blurb: "A wide shot, then the light and the moment.",
    sample: "The shot: the light, the lens, the moment.",
  },
  {
    kind: "haiku",
    label: "Haiku",
    icon: Feather,
    prompt: "A theme for a haiku",
    visual: false,
    blurb: "Three lines set large, the middle one stepped in.",
    sample: "Five beats to begin\nseven more to turn the thought\nfive to let it go",
  },
  {
    kind: "quote",
    label: "Quote",
    icon: Quote,
    prompt: "A theme for a quote",
    visual: false,
    blurb: "Big type under a big quotation mark.",
    sample: "Words worth repeating, set large.",
  },
  {
    kind: "joke",
    label: "Joke",
    icon: Laugh,
    prompt: "A topic for a joke",
    visual: false,
    blurb: "The setup, and a punchline readers tap to reveal.",
    sample: "The setup goes here.\n\nAnd the punchline after a blank line.",
  },
  {
    kind: "aphorism",
    label: "Aphorism",
    icon: Lightbulb,
    prompt: "A theme for an aphorism",
    visual: false,
    blurb: "One line, as bold as it gets.",
    sample: "One line. Make it count.",
  },
];

const byKind = new Map(kinds.map((info) => [info.kind, info]));

export function kindInfo(kind: SparkKind): KindInfo {
  return byKind.get(kind) ?? kinds[0];
}

export function isKind(value: unknown): value is SparkKind {
  return typeof value === "string" && byKind.has(value as SparkKind);
}
