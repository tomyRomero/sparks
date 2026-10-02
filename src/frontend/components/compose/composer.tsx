"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check, Eye, History, PenLine, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useId, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CharacterCount } from "@/components/ui/character-count";
import { Input, Textarea } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { api } from "@/lib/api/client";
import { ApiError, errorMessage } from "@/lib/api/problem";
import type { CurrentUser, Draft, Post, SparkKind } from "@/lib/api/types";
import { type ComposeDraft, type DraftImage, forgetDraft, hasContent, loadDraft, saveDraft } from "@/lib/compose-draft";
import { kindInfo, kinds } from "@/lib/kinds";
import { limits } from "@/lib/limits";
import { forgetPostLists } from "@/lib/queries/cache";
import { agoPhrase } from "@/lib/time";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import { ComposerPreview } from "./composer-preview";
import { ComposerSkeleton } from "./composer-skeleton";
import { KindPicker } from "./kind-picker";
import { PictureField, pictureIn, usePicture } from "./picture-field";

const FIRST_AI_KIND = kinds.find((info) => info.kind !== "regular")!.kind;

/** How long typing pauses before the draft is saved. */
const SAVE_AFTER_MS = 500;

/** Hints that match how AI drafts are laid out (see splitSpark). */
const formatHints: Partial<Record<SparkKind, string>> = {
  movieScript: "Start with “Title: …” on its own line, and the title goes over the poster.",
  bookPlot: "Start with “Title: …” on its own line, and the title goes beside the cover.",
  artwork: "Start with “Title: …” on its own line to name the piece.",
  joke: "Put the punchline after a blank line, and readers tap to reveal it.",
  haiku: "Three lines: five, seven and five syllables.",
};

const views = [
  { value: "write", label: "Write", icon: PenLine },
  { value: "preview", label: "Preview", icon: Eye },
] as const;

type ComposerProps = {
  viewer: CurrentUser;
  /** Open with the AI drafting panel, as the "Draft with AI" links do. */
  startWithAi: boolean;
  initialKind?: SparkKind;
  /** An idea to draft from straight away, from the right rail's quick draft. */
  initialIdea?: string;
};

/**
 * The composer starts once the browser can say whether a draft was saved,
 * so a restored draft never replaces a form the writer has already begun.
 * A link with an idea in it starts a new spark instead.
 */
export function Composer(props: ComposerProps) {
  const hydrated = useHydrated();
  const [saved] = useState(() =>
    typeof window === "undefined" || props.initialIdea ? null : loadDraft(props.viewer.id),
  );
  if (!hydrated) return <ComposerSkeleton />;
  return <ComposerForm {...props} saved={saved} />;
}

function startingKind(withAi: boolean, initialKind: SparkKind | undefined): SparkKind {
  if (initialKind && !(withAi && initialKind === "regular")) return initialKind;
  return withAi ? FIRST_AI_KIND : "regular";
}

function ComposerForm({
  viewer,
  startWithAi,
  initialKind,
  initialIdea,
  saved,
}: ComposerProps & { saved: ComposeDraft | null }) {
  const id = useId();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [withAi, setWithAi] = useState(saved?.withAi ?? startWithAi);
  const [kind, setKind] = useState<SparkKind>(saved?.kind ?? startingKind(startWithAi, initialKind));
  const [idea, setIdea] = useState(saved?.idea ?? (startWithAi ? (initialIdea ?? "") : ""));
  const [draftedFrom, setDraftedFrom] = useState(saved?.draftedFrom ?? null);
  const [body, setBody] = useState(saved?.body ?? "");
  const [imagePrompt, setImagePrompt] = useState(saved?.imagePrompt ?? "");
  const [image, setImage] = useState<DraftImage | null>(saved?.image ?? null);
  const [restoredAt, setRestoredAt] = useState(saved ? new Date(saved.savedAt).toISOString() : null);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "unavailable">(saved ? "saved" : "idle");
  const [view, setView] = useState<"write" | "preview">("write");
  const [draftError, setDraftError] = useState<string>();
  const [shareError, setShareError] = useState<string>();
  const [drafting, startDrafting] = useTransition();
  const [sharing, startSharing] = useTransition();
  const [shared, setShared] = useState(false);
  const [dragging, setDragging] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const picture = usePicture(setImage);
  const [mac] = useState(() => /Mac|iPhone|iPad/.test(navigator.userAgent));

  const info = kindInfo(kind);
  const busy = drafting || sharing;

  // Saved as typing pauses, and once more as the page goes, so a refresh or
  // a closed tab keeps it. A shared spark is no longer a draft.
  const latest = useRef<ComposeDraft | null>(null);
  useEffect(() => {
    const current = { withAi, kind, idea, draftedFrom, body, imagePrompt, image, savedAt: 0 };
    latest.current = shared ? null : current;
    if (shared) return;
    const timer = window.setTimeout(() => {
      if (!hasContent(current)) {
        forgetDraft(viewer.id);
        setSaveState("idle");
        return;
      }
      setSaveState(saveDraft(viewer.id, { ...current, savedAt: Date.now() }) ? "saved" : "unavailable");
    }, SAVE_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [viewer.id, shared, withAi, kind, idea, draftedFrom, body, imagePrompt, image]);
  useEffect(() => {
    const keep = () => {
      const last = latest.current;
      if (last && hasContent(last)) saveDraft(viewer.id, { ...last, savedAt: Date.now() });
    };
    window.addEventListener("pagehide", keep);
    return () => window.removeEventListener("pagehide", keep);
  }, [viewer.id]);

  // Only where the browser can't keep drafts does leaving lose work.
  const atRisk = saveState === "unavailable" && hasContent({ body, image }) && !shared;
  useEffect(() => {
    if (!atRisk) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [atRisk]);

  function chooseMode(ai: boolean) {
    setWithAi(ai);
    if (ai && kind === "regular") setKind(FIRST_AI_KIND);
  }

  function startOver() {
    setWithAi(startWithAi);
    setKind(startingKind(startWithAi, initialKind));
    setIdea("");
    setDraftedFrom(null);
    setBody("");
    setImagePrompt("");
    setImage(null);
    setRestoredAt(null);
    forgetDraft(viewer.id);
  }

  function draftWithAi() {
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

  // An idea that came with the link is drafted once, as soon as the page
  // opens; later drafts come from the button.
  const draftedOnOpen = useRef(false);
  const draftOnOpen = useEffectEvent(draftWithAi);
  useEffect(() => {
    if (draftedOnOpen.current || !startWithAi || !initialIdea?.trim()) return;
    draftedOnOpen.current = true;
    draftOnOpen();
  }, [startWithAi, initialIdea]);

  function share(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = body.trim();
    if (!text || busy || picture.busy) return;
    startSharing(async () => {
      try {
        const post = await api<Post>("/posts", {
          method: "POST",
          json: { kind, body: text, aiPrompt: draftedFrom ?? undefined, imageKey: image?.key },
        });
        forgetDraft(viewer.id);
        setShared(true);
        forgetPostLists(queryClient);
        toast.success("Spark shared");
        // Replace the composer in history, so Back goes where the writer came from.
        router.replace(`/p/${post.id}`);
      } catch (error) {
        setShareError((error instanceof ApiError && error.fieldError("body")) || errorMessage(error));
        setView("write");
      }
    });
  }

  // Anywhere on the form: Cmd/Ctrl+Enter shares, and a picture dropped or
  // pasted becomes the spark's picture.
  const takePicture = useEffectEvent((file: File) => picture.upload(file));
  useEffect(() => {
    const element = form.current;
    if (!element) return;
    let dragDepth = 0;
    const hasFiles = (event: DragEvent) => event.dataTransfer?.types.includes("Files") ?? false;
    const listeners = {
      keydown: (event: KeyboardEvent) => {
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && !event.defaultPrevented) {
          event.preventDefault();
          element.requestSubmit();
        }
      },
      paste: (event: ClipboardEvent) => {
        const file = pictureIn(event.clipboardData);
        if (!file) return;
        event.preventDefault();
        takePicture(file);
      },
      dragenter: (event: DragEvent) => {
        if (!hasFiles(event)) return;
        dragDepth += 1;
        setDragging(true);
      },
      dragleave: (event: DragEvent) => {
        if (!hasFiles(event)) return;
        dragDepth -= 1;
        if (dragDepth === 0) setDragging(false);
      },
      dragover: (event: DragEvent) => {
        if (hasFiles(event)) event.preventDefault();
      },
      drop: (event: DragEvent) => {
        if (!hasFiles(event)) return;
        event.preventDefault();
        dragDepth = 0;
        setDragging(false);
        const file = pictureIn(event.dataTransfer);
        if (file) takePicture(file);
      },
    };
    for (const [type, listener] of Object.entries(listeners)) element.addEventListener(type, listener as EventListener);
    return () => {
      for (const [type, listener] of Object.entries(listeners))
        element.removeEventListener(type, listener as EventListener);
    };
  }, []);

  const segment =
    "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium text-ink-soft transition-colors has-focus-visible:ring-2 has-focus-visible:ring-brand/40";
  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start xl:gap-8 2xl:grid-cols-[minmax(0,1fr)_440px]">
      <Segmented label="Show" value={view} options={views} onChange={setView} className="mb-4 xl:hidden" />

      <form
        onSubmit={share}
        ref={form}
        className={cn(
          "relative grid gap-7 rounded-[18px] border border-line bg-surface p-4 shadow-card sm:p-6",
          view === "preview" && "max-xl:hidden",
        )}
      >
        {restoredAt && (
          <div className="-mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-raised px-3.5 py-2.5 text-sm">
            <History className="size-4 shrink-0 text-muted" aria-hidden />
            <span className="flex-1 text-ink-soft">
              Your draft from {agoPhrase(restoredAt, "a moment ago")} is back.
            </span>
            <button type="button" onClick={startOver} className="font-medium text-brand hover:underline">
              Start over
            </button>
          </div>
        )}

        <fieldset disabled={busy} className="flex">
          <legend className="sr-only">How to write it</legend>
          <div className="inline-flex rounded-full border border-line bg-surface p-1">
            <label className={cn(segment, "has-checked:bg-raised has-checked:text-ink")}>
              <input
                type="radio"
                name="mode"
                checked={!withAi}
                onChange={() => chooseMode(false)}
                className="sr-only"
              />
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
          <section
            aria-labelledby={`${id}-ai`}
            className="grid gap-2 rounded-lg border border-charge/25 bg-charge-soft/60 p-4"
          >
            <h2
              id={`${id}-ai`}
              className="flex items-center gap-1.5 font-mono text-[11px] tracking-wide text-charge uppercase"
            >
              <Zap className="size-3.5 fill-current" aria-hidden />
              Draft with AI
            </h2>
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor={`${id}-idea`} className="text-sm font-medium text-ink-soft">
                {info.prompt}
              </label>
              <CharacterCount length={idea.length} max={limits.aiPromptMax} showFrom={limits.aiPromptMax * 0.9} />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id={`${id}-idea`}
                value={idea}
                onChange={(event) => setIdea(event.target.value)}
                onKeyDown={(event) => {
                  // Enter drafts rather than sharing whatever is in the text box below.
                  if (event.key === "Enter" && !event.metaKey && !event.ctrlKey) {
                    event.preventDefault();
                    draftWithAi();
                  }
                }}
                maxLength={limits.aiPromptMax}
                placeholder="A radio station that went quiet in 1962"
                disabled={busy}
                aria-invalid={draftError ? true : undefined}
                aria-describedby={draftError ? `${id}-idea-error` : undefined}
              />
              <Button type="button" variant="charge" onClick={draftWithAi} disabled={busy || !idea.trim()}>
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
            <span className="flex items-center gap-3">
              {draftedFrom && (
                <span className="inline-flex items-center gap-1 rounded-sm bg-charge-soft px-1.5 py-0.5 font-mono text-[10px] text-charge">
                  <Zap className="size-3 fill-current" aria-hidden />
                  ai draft · edit freely
                </span>
              )}
              <CharacterCount length={body.length} max={limits.postBodyMax} showFrom={limits.postBodyMax * 0.9} />
            </span>
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
            aria-describedby={
              [shareError && `${id}-body-error`, formatHints[kind] && `${id}-body-hint`].filter(Boolean).join(" ") ||
              undefined
            }
          />
          {formatHints[kind] && (
            <p id={`${id}-body-hint`} className="text-xs text-muted">
              {formatHints[kind]}
            </p>
          )}
          {shareError && (
            <p id={`${id}-body-error`} role="alert" className="text-sm text-danger">
              {shareError}
            </p>
          )}
        </div>

        <PictureField
          picture={picture}
          image={image}
          onRemove={() => setImage(null)}
          paint={withAi && info.visual ? { prompt: imagePrompt, onPromptChange: setImagePrompt } : undefined}
          disabled={busy}
        />

        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 border-t border-line pt-5">
          <p className="me-auto text-xs text-muted" aria-live="polite">
            {saveState === "saved" ? (
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5" aria-hidden />
                Draft saved in this browser
              </span>
            ) : saveState === "unavailable" ? (
              "This browser can't keep drafts, so share before you leave."
            ) : null}
          </p>
          <kbd className="font-mono text-[11px] text-muted max-md:hidden">{mac ? "⌘" : "Ctrl"} + Enter</kbd>
          <Button type="submit" size="lg" disabled={busy || picture.busy !== null || !body.trim()}>
            {sharing ? "Sharing…" : "Share spark"}
          </Button>
        </div>

        {dragging && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[18px] border-2 border-dashed border-brand bg-brand-soft/80 font-display text-lg font-semibold text-brand backdrop-blur-sm"
          >
            Drop to add the picture
          </div>
        )}
      </form>

      <aside aria-label="Preview" className={cn("xl:sticky xl:top-[88px]", view === "write" && "max-xl:hidden")}>
        <ComposerPreview viewer={viewer} kind={kind} body={body} image={image} aiPrompt={draftedFrom} />
      </aside>
    </div>
  );
}
