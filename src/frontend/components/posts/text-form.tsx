"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { errorMessage } from "@/lib/api/problem";
import { cn } from "@/lib/utils";

type TextFormProps = {
  /** The field's name for screen readers; the placeholder says it to everyone else. */
  label: string;
  placeholder: string;
  maxLength: number;
  submitLabel: string;
  initialValue?: string;
  /** Put the cursor in the field straight away, for forms opened by a click. */
  focusOnOpen?: boolean;
  /** Saves the text. A thrown error is shown under the field and the text kept. */
  onSubmit: (text: string) => Promise<void>;
  onCancel?: () => void;
  className?: string;
};

/** A comment, a reply, or an edit: one text box with a save button. ⌘/Ctrl+Enter saves. */
export function TextForm({
  label,
  placeholder,
  maxLength,
  submitLabel,
  initialValue = "",
  focusOnOpen = false,
  onSubmit,
  onCancel,
  className,
}: TextFormProps) {
  const id = useId();
  const field = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(initialValue);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!focusOnOpen || !field.current) return;
    field.current.focus();
    field.current.setSelectionRange(field.current.value.length, field.current.value.length);
  }, [focusOnOpen]);

  const trimmed = text.trim();
  const remaining = maxLength - text.length;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmed || pending) return;
    startTransition(async () => {
      try {
        await onSubmit(trimmed);
        setText("");
        setError(undefined);
      } catch (failure) {
        setError(errorMessage(failure));
      }
    });
  }

  return (
    <form onSubmit={submit} className={cn("grid gap-2", className)}>
      <Textarea
        ref={field}
        aria-label={label}
        placeholder={placeholder}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
          if (event.key === "Escape" && onCancel) onCancel();
        }}
        maxLength={maxLength}
        rows={3}
        className="min-h-20"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      <div className="flex items-center gap-2">
        {error && (
          <p id={`${id}-error`} role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        {remaining < maxLength * 0.1 && (
          <span className={cn("font-mono text-xs text-muted", remaining === 0 && "text-danger")}>{remaining}</span>
        )}
        <div className="ml-auto flex gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={pending}>
              Cancel
            </Button>
          )}
          <Button type="submit" size="sm" disabled={!trimmed || pending}>
            {pending ? "Saving…" : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
