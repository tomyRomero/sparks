"use client";

import { useEffect, useState } from "react";

export type FieldState = ReturnType<typeof useField>;

/** A field's value and problem. The problem shows after blur or submit, then updates live. */
export function useField(initial: string, check: (value: string) => string | undefined) {
  const [value, setValue] = useState(initial);
  const [touched, setTouched] = useState(false);
  const problem = check(value);
  return {
    value,
    problem,
    error: touched ? problem : undefined,
    touch: () => setTouched(true),
    props: {
      value,
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue(event.target.value),
      onBlur: () => setTouched(true),
    },
  };
}

/**
 * Touches every field and, if any has a problem, cancels the submit and
 * focuses the first one. `extraProblem` is for checks the field can't make
 * itself, like a taken username.
 */
export function stopIfInvalid(
  event: React.FormEvent<HTMLFormElement>,
  fields: [id: string, field: FieldState, extraProblem?: string][],
) {
  for (const [, field] of fields) field.touch();
  const first = fields.find(([, field, extraProblem]) => field.problem ?? extraProblem);
  if (!first) return;
  event.preventDefault();
  // After the re-render, so the field's message is there to be read with it.
  requestAnimationFrame(() => document.getElementById(first[0])?.focus());
}

/** The value once it has stopped changing for `delayMs`: for lookups as someone types. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return settled;
}
