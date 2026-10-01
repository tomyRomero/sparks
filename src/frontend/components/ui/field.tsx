import { CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  success?: string;
  hint?: string;
  /** Beside the label, at the end of its row: a character count, say. */
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

/**
 * Label, control, and one message: error, else success, else hint. The input
 * should take aria-invalid and aria-describedby from `fieldDescription`.
 */
export function Field({ id, label, error, success, hint, aside, className, children }: FieldProps) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink-soft">
          {label}
        </label>
        {aside}
      </div>
      {children}
      {error ? (
        <p id={`${id}-message`} className="flex items-start gap-1.5 text-sm text-danger">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : success ? (
        <p id={`${id}-message`} className="flex items-start gap-1.5 text-sm text-success">
          <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          {success}
        </p>
      ) : hint ? (
        <p id={`${id}-message`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function fieldDescription(id: string, error?: string, message?: string) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error || message ? `${id}-message` : undefined,
  } as const;
}
