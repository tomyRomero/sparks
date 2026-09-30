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
};

export const kinds: KindInfo[] = [
  { kind: "regular", label: "Spark", icon: PenLine, prompt: "", visual: false },
  { kind: "movieScript", label: "Movie script", icon: Clapperboard, prompt: "An outline for a film", visual: true },
  { kind: "bookPlot", label: "Book plot", icon: BookOpen, prompt: "An outline for a novel", visual: true },
  { kind: "artwork", label: "Artwork", icon: Palette, prompt: "An idea for a piece of art", visual: true },
  { kind: "fashion", label: "Fashion", icon: Shirt, prompt: "An idea for a look", visual: true },
  { kind: "photography", label: "Photography", icon: Camera, prompt: "An idea for a photo", visual: true },
  { kind: "haiku", label: "Haiku", icon: Feather, prompt: "A theme for a haiku", visual: false },
  { kind: "quote", label: "Quote", icon: Quote, prompt: "A theme for a quote", visual: false },
  { kind: "joke", label: "Joke", icon: Laugh, prompt: "A topic for a joke", visual: false },
  { kind: "aphorism", label: "Aphorism", icon: Lightbulb, prompt: "A theme for an aphorism", visual: false },
];

const byKind = new Map(kinds.map((info) => [info.kind, info]));

export function kindInfo(kind: SparkKind): KindInfo {
  return byKind.get(kind) ?? kinds[0];
}

export function isKind(value: unknown): value is SparkKind {
  return typeof value === "string" && byKind.has(value as SparkKind);
}
