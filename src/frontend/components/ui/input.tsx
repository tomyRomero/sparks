import { cn } from "@/lib/utils";

const fieldStyle =
  "w-full rounded-md border border-line bg-surface px-3 text-ink placeholder:text-muted transition-colors focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25 aria-invalid:border-danger disabled:opacity-60";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(fieldStyle, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(fieldStyle, "min-h-24 resize-y py-2 leading-relaxed", className)} {...props} />;
}
