import type { SparkKind } from "@/lib/api/types";
import { kinds } from "@/lib/kinds";
import { cn } from "@/lib/utils";

type KindPickerProps = {
  value: SparkKind;
  onChange: (kind: SparkKind) => void;
  /** Leave out plain sparks, which the AI doesn't write. */
  aiOnly: boolean;
  disabled?: boolean;
};

/** Radio buttons styled as chips, so arrow keys work. */
export function KindPicker({ value, onChange, aiOnly, disabled = false }: KindPickerProps) {
  const options = aiOnly ? kinds.filter((info) => info.kind !== "regular") : kinds;
  return (
    <fieldset disabled={disabled}>
      <legend className="text-sm font-medium text-ink-soft">Kind</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map(({ kind, label, icon: Icon }) => (
          <label
            key={kind}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-line-strong hover:text-ink",
              "has-checked:border-brand has-checked:bg-brand has-checked:text-brand-ink",
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
            <Icon className="size-3.5 shrink-0" aria-hidden />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
