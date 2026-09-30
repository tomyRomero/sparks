import { CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type FieldProps = {
  /** The id of the input inside, which the label points at. */
  id: string;
  label: string;
  error?: string;
  /** A confirmation, such as a username being free. Shown when there's no error. */
  success?: string;
  hint?: string;
  /** Beside the label, at the end of its row: a character count, say. */
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

/**
 * A labelled form control with one message below: its error, else a
 * confirmation, else its hint. The input inside should set aria-invalid and
 * aria-describedby from `fieldDescription`, so a screen reader reads the
 * message whenever the field gets focus.
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

/** The accessibility attributes linking an input to its Field's message. */
export function fieldDescription(id: string, error?: string, message?: string) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error || message ? `${id}-message` : undefined,
  } as const;
}
