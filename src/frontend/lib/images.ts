// Mirrors ImageUploadService.cs to fail fast; the API checks the content again.
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"] as const;

export const POST_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export function imageProblem(file: File, maxBytes: number): string | null {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return "Pictures must be PNG, JPEG, GIF or WebP.";
  if (file.size === 0) return "That file is empty.";
  if (file.size > maxBytes)
    return `That picture is ${megabytes(file.size, Math.ceil)} MB. Pictures can be up to ${megabytes(maxBytes)} MB.`;
  return null;
}

/** "3.4" for 3.4 MB. Rounds up, so a file just over the limit never shows as equal. */
export function megabytes(bytes: number, round: (value: number) => number = Math.round): string {
  return String(round((bytes / (1024 * 1024)) * 10) / 10);
}
