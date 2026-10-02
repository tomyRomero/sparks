"use client";

import { Zap } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useId, useState } from "react";
import type { SparkKind } from "@/lib/api/types";
import { kindInfo } from "@/lib/kinds";
import { limits } from "@/lib/limits";
import { cn } from "@/lib/utils";
import { DraftWithAiTitle } from "./draft-with-ai-title";

const offered: SparkKind[] = ["movieScript", "bookPlot", "haiku", "artwork", "joke"];

export function QuickDraft() {
  const id = useId();
  const router = useRouter();
  const pathname = usePathname();
  const [idea, setIdea] = useState("");
  const [kind, setKind] = useState<SparkKind>("movieScript");

  // The composer is the full version of this card; beside it, this would only repeat it.
  if (pathname === "/create") return null;

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="flex flex-col gap-3.5 rounded-[18px] border border-line bg-surface p-5 shadow-card"
    >
      <DraftWithAiTitle id={`${id}-title`} />
      <p className="text-sm leading-normal text-ink-soft">
        Give it one line and a kind. You edit the draft before anyone sees it.
      </p>
      <form
        className="flex flex-col gap-3.5"
        onSubmit={(event) => {
          event.preventDefault();
          const text = idea.trim();
          if (!text) return;
          router.push(`/create?${new URLSearchParams({ ai: "1", kind, idea: text })}`);
        }}
      >
        <label htmlFor={`${id}-idea`} className="sr-only">
          Your idea
        </label>
        <textarea
          id={`${id}-idea`}
          rows={3}
          value={idea}
          onChange={(event) => setIdea(event.target.value)}
          maxLength={limits.aiPromptMax}
          placeholder="A lighthouse keeper hears a radio station that went off air decades ago"
          className="w-full resize-none rounded-xl border border-line bg-canvas px-3.5 py-3 text-sm leading-normal placeholder:text-muted focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25 focus-visible:outline-none"
        />
        <fieldset>
          <legend className="sr-only">Kind</legend>
          <div className="flex flex-wrap gap-1.5">
            {offered.map((option) => (
              <label
                key={option}
                className={cn(
                  "inline-flex h-[30px] cursor-pointer items-center rounded-full border border-line bg-surface px-2.5 font-mono text-[11px] text-muted transition-colors hover:border-line-strong has-focus-visible:ring-2 has-focus-visible:ring-brand/40",
                  "has-checked:border-charge has-checked:bg-charge-soft has-checked:text-charge",
                )}
              >
                <input
                  type="radio"
                  name={`${id}-kind`}
                  value={option}
                  checked={kind === option}
                  onChange={() => setKind(option)}
                  className="sr-only"
                />
                {kindInfo(option).label}
              </label>
            ))}
          </div>
        </fieldset>
        <button
          type="submit"
          disabled={!idea.trim()}
          className="inline-flex h-[42px] items-center justify-center gap-2 rounded-xl bg-charge px-4 text-[14.5px] font-semibold text-brand-ink transition-colors hover:bg-charge-bright disabled:opacity-50"
        >
          <Zap className="size-4 fill-current" aria-hidden />
          Draft it
        </button>
      </form>
    </section>
  );
}
