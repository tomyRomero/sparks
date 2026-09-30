"use client";

import { ImageUp, Zap } from "lucide-react";
import Image from "next/image";
import { useId, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/problem";
import type { UploadedImage } from "@/lib/api/types";
import { IMAGE_TYPES, imageProblem, POST_IMAGE_MAX_BYTES } from "@/lib/images";
import { limits } from "@/lib/limits";
import { cn } from "@/lib/utils";

type PictureFieldProps = {
  image: UploadedImage | null;
  onChange: (image: UploadedImage | null) => void;
  /** Offer to paint the picture with AI from this prompt, which the member can edit. */
  paint?: { prompt: string; onPromptChange: (prompt: string) => void };
  disabled?: boolean;
};

/** A spark's optional picture: uploaded, or painted by the AI, with a preview. */
export function PictureField({ image, onChange, paint, disabled = false }: PictureFieldProps) {
  const id = useId();
  const [busy, setBusy] = useState<"uploading" | "painting" | null>(null);
  const [error, setError] = useState<string>();

  async function run(kind: "uploading" | "painting", work: () => Promise<UploadedImage>) {
    setBusy(kind);
    setError(undefined);
    try {
      onChange(await work());
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(null);
    }
  }

  function upload(file: File) {
    const problem = imageProblem(file, POST_IMAGE_MAX_BYTES);
    if (problem) {
      setError(problem);
      return;
    }
    const form = new FormData();
    form.append("file", file);
    void run("uploading", () => api<UploadedImage>("/images", { method: "POST", body: form }));
  }

  function paintPicture() {
    const prompt = paint?.prompt.trim();
    if (!prompt) return;
    void run("painting", () => api<UploadedImage>("/ai/images", { method: "POST", json: { prompt } }));
  }

  const locked = disabled || busy !== null;
  return (
    <fieldset disabled={locked} className="grid gap-3" aria-busy={busy !== null}>
      <legend className="text-sm font-medium text-ink-soft">
        Picture <span className="font-normal text-muted">(optional)</span>
      </legend>

      {(image || busy) && (
        <div
          className={cn(
            "relative aspect-[4/3] overflow-hidden rounded-lg border border-line bg-raised",
            busy === "painting" && "charge-shimmer",
          )}
        >
          {image && busy !== "painting" && (
            <Image
              src={image.url}
              alt="The picture for this spark"
              fill
              loading="eager"
              sizes="(min-width: 768px) 640px, 100vw"
              className="object-cover"
            />
          )}
          {busy && (
            <p
              role="status"
              className="absolute inset-x-0 bottom-0 bg-canvas/80 px-4 py-2 text-sm text-ink-soft backdrop-blur"
            >
              {busy === "painting" ? "Painting your picture…" : "Uploading…"}
            </p>
          )}
        </div>
      )}

      {paint && (
        <div className="grid gap-1.5">
          <label htmlFor={`${id}-prompt`} className="text-sm text-muted">
            Describe the picture for the AI
          </label>
          <div className="flex gap-2">
            <Input
              id={`${id}-prompt`}
              value={paint.prompt}
              onChange={(event) => paint.onPromptChange(event.target.value)}
              maxLength={limits.aiPromptMax}
              placeholder="A lighthouse at night, lit from within"
            />
            <Button type="button" variant="charge" onClick={paintPicture} disabled={!paint.prompt.trim()}>
              <Zap className="fill-current" aria-hidden />
              {image ? "Paint again" : "Paint it"}
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {/* The input sits inside its label, so the label opens the file picker and shows the input's focus. */}
        <label
          className={cn(
            buttonVariants({ variant: "secondary", size: "sm" }),
            "cursor-pointer has-focus-visible:ring-2 has-focus-visible:ring-brand/40",
            locked && "pointer-events-none opacity-50",
          )}
        >
          <ImageUp aria-hidden />
          {image ? "Upload another" : "Upload a picture"}
          <input
            type="file"
            accept={IMAGE_TYPES.join(",")}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) upload(file);
            }}
          />
        </label>
        {image && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
            Remove
          </Button>
        )}
        <span className="text-xs text-muted">PNG, JPEG, GIF or WebP, up to 5 MB.</span>
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
