"use client";

import { useEffect, useState } from "react";

export type FieldState = ReturnType<typeof useField>;

/**
 * One text field's value and what's wrong with it. The problem shows once
 * the member leaves the field or tries to submit, then updates as they type:
 * it clears the moment they fix it, but never nags halfway through a word.
 */
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
 * For a form's onSubmit: shows every field's problem and, if there is one,
 * stops the submit and puts the cursor in the first field with a problem.
 * Each entry is the input's id, its field, and optionally a problem the
 * field can't see itself (a username that's taken). A prevented submit
 * never reaches the form's action.
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
