/**
 * The pictures the API takes (ImageUploadService.cs): checked here so a
 * wrong file fails at once instead of after an upload. The API checks again,
 * by the file's content rather than its name.
 */
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"] as const;

export const POST_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

/** Why a file can't be uploaded as a picture, or null when it can. */
export function imageProblem(file: File, maxBytes: number): string | null {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return "Pictures must be PNG, JPEG, GIF or WebP.";
  if (file.size === 0) return "That file is empty.";
  if (file.size > maxBytes)
    return `That picture is ${megabytes(file.size, Math.ceil)} MB. Pictures can be up to ${megabytes(maxBytes)} MB.`;
  return null;
}

/**
 * 3.4 for 3.4 MB, whole numbers without the ".0". A file's size rounds up,
 * so one just over the limit never reads as equal to it.
 */
function megabytes(bytes: number, round: (value: number) => number = Math.round): string {
  return String(round((bytes / (1024 * 1024)) * 10) / 10);
}
