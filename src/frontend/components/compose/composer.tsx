"use client";

import { useQueryClient } from "@tanstack/react-query";
import { PenLine, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { ApiError, errorMessage } from "@/lib/api/problem";
import type { Draft, Post, SparkKind, UploadedImage } from "@/lib/api/types";
import { kindInfo, kinds } from "@/lib/kinds";
import { limits } from "@/lib/limits";
import { forgetPostLists } from "@/lib/queries/cache";
import { cn } from "@/lib/utils";
import { KindPicker } from "./kind-picker";
import { PictureField } from "./picture-field";

/** The kind AI drafting starts on when none was asked for. */
const FIRST_AI_KIND = kinds.find((info) => info.kind !== "regular")!.kind;

type ComposerProps = {
  /** Open with the AI drafting panel, as the "Draft with AI" links do. */
  startWithAi: boolean;
  initialKind?: SparkKind;
};

/**
 * Writes a spark by hand, or drafts it with AI from a one-line idea and then
 * edits it. Visual kinds can have their picture painted too. A spark drafted
 * with AI carries the prompt it came from, so readers can see it.
 */
export function Composer({ startWithAi, initialKind }: ComposerProps) {
  const id = useId();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [withAi, setWithAi] = useState(startWithAi);
  const [kind, setKind] = useState<SparkKind>(
    initialKind && !(startWithAi && initialKind === "regular") ? initialKind : startWithAi ? FIRST_AI_KIND : "regular",
  );
  const [idea, setIdea] = useState("");
  const [draftedFrom, setDraftedFrom] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [draftError, setDraftError] = useState<string>();
  const [shareError, setShareError] = useState<string>();
  const [drafting, startDrafting] = useTransition();
  const [sharing, startSharing] = useTransition();
  const [shared, setShared] = useState(false);

  const info = kindInfo(kind);
  const busy = drafting || sharing;

  // Leaving with something written asks first; a shared spark is safe.
  const unsaved = (body.trim() !== "" || image !== null) && !shared;
  useEffect(() => {
    if (!unsaved) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);

  function chooseMode(ai: boolean) {
    setWithAi(ai);
    if (ai && kind === "regular") setKind(FIRST_AI_KIND);
  }

  function draft() {
    const prompt = idea.trim();
    if (!prompt) return;
    startDrafting(async () => {
      try {
        const result = await api<Draft>("/ai/drafts", { method: "POST", json: { kind, prompt } });
        setBody(result.body);
        setDraftedFrom(prompt);
        setImagePrompt(result.imagePrompt ?? "");
        setDraftError(undefined);
      } catch (error) {
        setDraftError(errorMessage(error));
      }
    });
  }

  function share(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;
    startSharing(async () => {
      try {
        const post = await api<Post>("/posts", {
          method: "POST",
          json: { kind, body: text, aiPrompt: draftedFrom ?? undefined, imageKey: image?.key },
        });
        setShared(true);
        forgetPostLists(queryClient);
        toast.success("Spark shared");
        router.push(`/p/${post.id}`);
      } catch (error) {
        setShareError((error instanceof ApiError && error.fieldError("body")) || errorMessage(error));
      }
    });
  }

  const segment =
    "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium text-ink-soft transition-colors has-focus-visible:ring-2 has-focus-visible:ring-brand/40";
  return (
    <form onSubmit={share} className="grid gap-7 px-4 py-6 sm:px-6">
      <fieldset disabled={busy} className="flex">
        <legend className="sr-only">How to write it</legend>
        <div className="inline-flex rounded-full border border-line bg-surface p-1">
          <label className={cn(segment, "has-checked:bg-raised has-checked:text-ink")}>
            <input type="radio" name="mode" checked={!withAi} onChange={() => chooseMode(false)} className="sr-only" />
            <PenLine className="size-4" aria-hidden />
            Write it
          </label>
          <label className={cn(segment, "has-checked:bg-charge has-checked:text-brand-ink")}>
            <input type="radio" name="mode" checked={withAi} onChange={() => chooseMode(true)} className="sr-only" />
            <Zap className="size-4 fill-current" aria-hidden />
            Draft with AI
          </label>
        </div>
      </fieldset>

      <KindPicker value={kind} onChange={setKind} aiOnly={withAi} disabled={busy} />

      {withAi && (
        <section aria-labelledby={`${id}-ai`} className="grid gap-2 rounded-lg border border-charge/25 bg-charge-soft/60 p-4">
          <h2 id={`${id}-ai`} className="flex items-center gap-1.5 font-mono text-[11px] tracking-wide text-charge uppercase">
            <Zap className="size-3.5 fill-current" aria-hidden />
            Draft with AI
          </h2>
          <label htmlFor={`${id}-idea`} className="text-sm font-medium text-ink-soft">
            {info.prompt}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id={`${id}-idea`}
              value={idea}
              onChange={(event) => setIdea(event.target.value)}
              onKeyDown={(event) => {
                // Enter drafts rather than sharing whatever is in the text box below.
                if (event.key === "Enter") {
                  event.preventDefault();
                  draft();
                }
              }}
              maxLength={limits.aiPromptMax}
              placeholder="A radio station that went quiet in 1962"
              disabled={busy}
              aria-invalid={draftError ? true : undefined}
              aria-describedby={draftError ? `${id}-idea-error` : undefined}
            />
            <Button type="button" variant="charge" onClick={draft} disabled={busy || !idea.trim()}>
              <Zap className="fill-current" aria-hidden />
              {drafting ? "Drafting…" : draftedFrom ? "Draft again" : "Draft it"}
            </Button>
          </div>
          {draftError && (
            <p id={`${id}-idea-error`} role="alert" className="text-sm text-danger">
              {draftError}
            </p>
          )}
        </section>
      )}

      <div className="grid gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={`${id}-body`} className="text-sm font-medium text-ink-soft">
            {kind === "regular" ? "Your spark" : `Your ${info.label.toLowerCase()}`}
          </label>
          {draftedFrom && (
            <span className="inline-flex items-center gap-1 rounded-sm bg-charge-soft px-1.5 py-0.5 font-mono text-[10px] text-charge">
              <Zap className="size-3 fill-current" aria-hidden />
              ai draft · edit freely
            </span>
          )}
        </div>
        <Textarea
          id={`${id}-body`}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={limits.postBodyMax}
          rows={kind === "movieScript" || kind === "bookPlot" ? 10 : 6}
          placeholder={withAi ? "Your draft appears here, ready to edit." : "What's on your mind?"}
          className={cn(drafting && "charge-shimmer")}
          aria-busy={drafting}
          disabled={busy}
          aria-invalid={shareError ? true : undefined}
          aria-describedby={shareError ? `${id}-body-error` : undefined}
        />
        {shareError && (
          <p id={`${id}-body-error`} role="alert" className="text-sm text-danger">
            {shareError}
          </p>
        )}
      </div>

      <PictureField
        image={image}
        onChange={setImage}
        paint={withAi && info.visual ? { prompt: imagePrompt, onPromptChange: setImagePrompt } : undefined}
        disabled={busy}
      />

      <div className="flex items-center justify-end gap-3 border-t border-line pt-5">
        <Button type="submit" size="lg" disabled={busy || !body.trim()}>
          {sharing ? "Sharing…" : "Share spark"}
        </Button>
      </div>
    </form>
  );
}
