import type { SparkKind } from "@/lib/api/types";
import { kindInfo, kinds } from "@/lib/kinds";
import { cn } from "@/lib/utils";
import { KindSketch } from "./kind-sketch";

type KindPickerProps = {
  value: SparkKind;
  onChange: (kind: SparkKind) => void;
  /** Leave out plain sparks, which the AI doesn't write. */
  aiOnly: boolean;
  disabled?: boolean;
};

/**
 * Radio buttons drawn as cards, each a sketch of its layout, so arrow keys
 * still work. On a phone they're pills that wrap, so the words stay in reach.
 */
export function KindPicker({ value, onChange, aiOnly, disabled = false }: KindPickerProps) {
  const options = aiOnly ? kinds.filter((info) => info.kind !== "regular") : kinds;
  return (
    <fieldset disabled={disabled} aria-describedby="kind-blurb">
      <legend className="text-sm font-medium text-ink-soft">Kind</legend>
      <div className="mt-2 flex flex-wrap gap-2 sm:grid sm:grid-cols-5">
        {options.map(({ kind, label, icon: Icon }) => (
          <label
            key={kind}
            className={cn(
              "group flex h-9 cursor-pointer items-center rounded-full border border-line bg-surface px-3.5 text-ink-soft transition-colors hover:border-line-strong hover:text-ink",
              "sm:h-auto sm:flex-col sm:gap-2 sm:rounded-[14px] sm:px-1.5 sm:pt-3 sm:pb-2.5",
              "has-checked:border-brand has-checked:bg-brand-soft/50 has-checked:text-brand",
              "has-focus-visible:ring-2 has-focus-visible:ring-brand/40 has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-canvas",
              "has-disabled:cursor-default has-disabled:opacity-60",
            )}
          >
            <input
              type="radio"
              name="kind"
              value={kind}
              checked={value === kind}
              onChange={() => onChange(kind)}
              className="sr-only"
            />
            <KindSketch kind={kind} className="max-sm:hidden" />
            <span className="flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap">
              <Icon className="size-3.5 shrink-0" aria-hidden />
              {label}
            </span>
          </label>
        ))}
      </div>
      <p id="kind-blurb" className="mt-2.5 text-sm text-muted">
        {kindInfo(value).blurb}
      </p>
    </fieldset>
  );
}
