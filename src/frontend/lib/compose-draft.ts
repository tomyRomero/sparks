import type { SparkKind, UploadedImage } from "@/lib/api/types";
import { isKind } from "@/lib/kinds";
import { limits } from "@/lib/limits";

/** What the composer keeps in this browser between visits, per member. */
export type ComposeDraft = {
  withAi: boolean;
  kind: SparkKind;
  /** The AI idea box. */
  idea: string;
  /** The idea the body was drafted from, if the AI wrote it. */
  draftedFrom: string | null;
  body: string;
  imagePrompt: string;
  image: DraftImage | null;
  savedAt: number;
};

export type DraftImage = UploadedImage & { uploadedAt: number };

const PREFIX = "sparks:draft:";

/**
 * How long a draft keeps its picture. Uploads nothing uses are swept after a
 * day (StorageOptions.KeepUnusedFor); past this, the picture may be gone.
 */
export const DRAFT_IMAGE_KEEP_MS = 20 * 60 * 60 * 1000;

export function hasContent(draft: Pick<ComposeDraft, "body" | "image">): boolean {
  return draft.body.trim() !== "" || draft.image !== null;
}

/** A stored draft, or null when there's none or it doesn't read as one. */
export function parseDraft(raw: string | null, now: number): ComposeDraft | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(value) || !isKind(value.kind) || typeof value.body !== "string" || typeof value.savedAt !== "number") {
    return null;
  }

  const { image } = value;
  const freshImage =
    isRecord(image) &&
    typeof image.key === "string" &&
    typeof image.url === "string" &&
    typeof image.uploadedAt === "number" &&
    now - image.uploadedAt < DRAFT_IMAGE_KEEP_MS;
  // The AI doesn't write plain sparks, so that pair can't come back as AI.
  const withAi = value.withAi === true && value.kind !== "regular";
  return {
    withAi,
    kind: value.kind,
    idea: text(value.idea, limits.aiPromptMax),
    draftedFrom: typeof value.draftedFrom === "string" ? value.draftedFrom : null,
    body: value.body.slice(0, limits.postBodyMax),
    imagePrompt: text(value.imagePrompt, limits.aiPromptMax),
    image: freshImage
      ? { key: image.key as string, url: image.url as string, uploadedAt: image.uploadedAt as number }
      : null,
    savedAt: value.savedAt,
  };
}

export function loadDraft(viewerId: number): ComposeDraft | null {
  try {
    return parseDraft(window.localStorage.getItem(PREFIX + viewerId), Date.now());
  } catch {
    return null;
  }
}

/** Whether it was kept: storage can be full or blocked. */
export function saveDraft(viewerId: number, draft: ComposeDraft): boolean {
  try {
    window.localStorage.setItem(PREFIX + viewerId, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function forgetDraft(viewerId: number) {
  try {
    window.localStorage.removeItem(PREFIX + viewerId);
  } catch {
    // Nothing was kept, then.
  }
}

/** Every member's draft in this browser, for signing out. */
export function forgetAllDrafts() {
  try {
    const storage = window.localStorage;
    const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
    for (const key of keys) {
      if (key?.startsWith(PREFIX)) storage.removeItem(key);
    }
  } catch {
    // Nothing was kept, then.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}
