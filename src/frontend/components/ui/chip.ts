import { cn } from "@/lib/utils";

/** A rounded filter control; brand-tinted while it's narrowing what's shown. */
export function chipStyle(on: boolean, className?: string) {
  return cn(
    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13.5px] font-medium whitespace-nowrap transition-colors data-[state=open]:border-line-strong [&_svg]:size-3.5 [&_svg]:shrink-0",
    on
      ? "border-brand/35 bg-brand-soft text-brand hover:border-brand/60"
      : "border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink",
    className,
  );
}
