"use client";

import type { LucideIcon } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export type SegmentedOption<V extends string> = {
  value: V;
  label: string;
  /** A shorter label for phones; the full one is still what's read out. */
  short?: string;
  icon?: LucideIcon;
};

type SegmentedProps<V extends string> = {
  /** What the choice is about, for screen readers: "Sort". */
  label: string;
  value: V;
  options: readonly SegmentedOption<V>[];
  onChange: (value: V) => void;
  className?: string;
};

/** One choice of a few, as a radio group: Tab reaches the chosen one, arrows move between them. */
export function Segmented<V extends string>({ label, value, options, onChange, className }: SegmentedProps<V>) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const chosen = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  function move(step: number) {
    const next = (chosen + step + options.length) % options.length;
    onChange(options[next].value);
    buttons.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex shrink-0 items-center rounded-full border border-line bg-surface p-[3px]", className)}
    >
      {options.map((option, index) => {
        const checked = index === chosen;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            ref={(button) => {
              buttons.current[index] = button;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={option.short ? option.label : undefined}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => {
              const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
              if (step === undefined) return;
              event.preventDefault();
              move(step);
            }}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium whitespace-nowrap transition-colors",
              checked ? "bg-ink text-canvas" : "text-ink-soft hover:text-ink",
            )}
          >
            {Icon && <Icon className="size-3.5" aria-hidden />}
            {option.short ? (
              <>
                <span className="max-sm:hidden">{option.label}</span>
                <span className="sm:hidden">{option.short}</span>
              </>
            ) : (
              option.label
            )}
          </button>
        );
      })}
    </div>
  );
}
