"use client";

import { ImagePlus, Zap } from "lucide-react";
import Image from "next/image";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/problem";
import type { UploadedImage } from "@/lib/api/types";
import type { DraftImage } from "@/lib/compose-draft";
import { IMAGE_TYPES, imageProblem, megabytes, POST_IMAGE_MAX_BYTES } from "@/lib/images";
import { limits } from "@/lib/limits";
import { cn } from "@/lib/utils";

export type Picture = ReturnType<typeof usePicture>;

/** Uploading or painting the spark's picture, for the field and for drops and pastes anywhere on the form. */
export function usePicture(onChange: (image: DraftImage | null) => void) {
  const [busy, setBusy] = useState<"uploading" | "painting" | null>(null);
  const [error, setError] = useState<string>();

  async function run(kind: "uploading" | "painting", work: () => Promise<UploadedImage>) {
    setBusy(kind);
    setError(undefined);
    try {
      onChange({ ...(await work()), uploadedAt: Date.now() });
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(null);
    }
  }

  function upload(file: File) {
    if (busy) return;
    const problem = imageProblem(file, POST_IMAGE_MAX_BYTES);
    if (problem) {
      setError(problem);
      return;
    }
    const form = new FormData();
    form.append("file", file);
    void run("uploading", () => api<UploadedImage>("/images", { method: "POST", body: form }));
  }

  function paint(prompt: string) {
    if (busy || !prompt.trim()) return;
    void run("painting", () => api<UploadedImage>("/ai/images", { method: "POST", json: { prompt: prompt.trim() } }));
  }

  return { busy, error, upload, paint };
}

/** The first picture in a drop or a paste, if there is one. */
export function pictureIn(data: DataTransfer | null): File | undefined {
  return Array.from(data?.files ?? []).find((file) => file.type.startsWith("image/"));
}

type PictureFieldProps = {
  picture: Picture;
  image: DraftImage | null;
  onRemove: () => void;
  /** Offer to paint the picture with AI from this prompt, which the member can edit. */
  paint?: { prompt: string; onPromptChange: (prompt: string) => void };
  disabled?: boolean;
};

export function PictureField({ picture, image, onRemove, paint, disabled = false }: PictureFieldProps) {
  const id = useId();
  const { busy, error } = picture;
  const locked = disabled || busy !== null;

  // The input sits inside its label, so the label opens the file picker and shows the input's focus.
  const browse = (content: React.ReactNode, className: string) => (
    <label className={cn(className, locked ? "pointer-events-none opacity-60" : "cursor-pointer")}>
      {content}
      <input
        type="file"
        accept={IMAGE_TYPES.join(",")}
        className="sr-only"
        disabled={locked}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) picture.upload(file);
        }}
      />
    </label>
  );

  return (
    <fieldset disabled={locked} className="grid gap-3" aria-busy={busy !== null}>
      <legend className="text-sm font-medium text-ink-soft">
        Picture <span className="font-normal text-muted">(optional)</span>
      </legend>

      {image || busy ? (
        <div
          className={cn(
            "relative aspect-[4/3] overflow-hidden rounded-[14px] border border-line bg-raised",
            busy === "painting" && "charge-shimmer",
          )}
        >
          {image && busy !== "painting" && (
            <Image
              src={image.url}
              alt="The picture for this spark"
              fill
              loading="eager"
              sizes="(min-width: 1280px) 640px, 100vw"
              className={cn("object-cover transition-opacity", busy === "uploading" && "opacity-40")}
            />
          )}
          {busy ? (
            <p
              role="status"
              className="absolute inset-x-0 bottom-0 bg-canvas/80 px-4 py-2 text-sm text-ink-soft backdrop-blur"
            >
              {busy === "painting" ? "Painting your picture…" : "Uploading…"}
            </p>
          ) : (
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/50 to-transparent p-3 pt-10">
              {browse(
                "Replace",
                "inline-flex h-8 items-center rounded-md bg-surface/90 px-3 text-sm font-medium text-ink backdrop-blur transition-colors hover:bg-surface has-focus-visible:ring-2 has-focus-visible:ring-brand/40",
              )}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="bg-surface/90 backdrop-blur"
                onClick={onRemove}
              >
                Remove
              </Button>
            </div>
          )}
        </div>
      ) : (
        browse(
          <>
            <ImagePlus className="size-6 text-muted" aria-hidden />
            <span className="text-sm font-medium text-ink-soft">Drop a picture, paste one, or browse</span>
            <span className="text-xs text-muted">
              PNG, JPEG, GIF or WebP, up to {megabytes(POST_IMAGE_MAX_BYTES)} MB
            </span>
          </>,
          "flex flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-line-strong px-4 py-7 text-center transition-colors hover:border-brand hover:bg-brand-soft/30 has-focus-visible:ring-2 has-focus-visible:ring-brand/40",
        )
      )}

      {paint && (
        <div className="grid gap-1.5">
          <label htmlFor={`${id}-prompt`} className="text-sm text-muted">
            Or describe a picture for the AI to paint
          </label>
          <div className="flex gap-2">
            <Input
              id={`${id}-prompt`}
              value={paint.prompt}
              onChange={(event) => paint.onPromptChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  picture.paint(paint.prompt);
                }
              }}
              maxLength={limits.aiPromptMax}
              placeholder="A lighthouse at night, lit from within"
            />
            <Button
              type="button"
              variant="charge"
              onClick={() => picture.paint(paint.prompt)}
              disabled={!paint.prompt.trim()}
            >
              <Zap className="fill-current" aria-hidden />
              {image ? "Paint again" : "Paint it"}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
