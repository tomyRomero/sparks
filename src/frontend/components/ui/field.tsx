import { cn } from "@/lib/utils";

type FieldProps = {
  /** The id of the input inside, which the label points at. */
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * A labelled form control with its hint or error below. The input inside
 * should set aria-invalid and aria-describedby from `fieldDescription`.
 */
export function Field({ id, label, error, hint, className, children }: FieldProps) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink-soft">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-message`} role="alert" className="text-sm text-danger">
          {error}
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
export function fieldDescription(id: string, error?: string, hint?: string) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error || hint ? `${id}-message` : undefined,
  } as const;
}
