"use client";

import { Circle, CircleAlert, CircleCheck } from "lucide-react";
import { useState } from "react";
import { limits } from "@/lib/limits";
import { cn } from "@/lib/utils";
import { passwordChecks } from "@/lib/validation";
import { Input } from "./input";

/** A password box with a button to show what's been typed. */
export function PasswordInput({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={shown ? "text" : "password"} className={cn("pr-20", className)} />
      <button
        type="button"
        onClick={() => setShown((value) => !value)}
        aria-controls={props.id}
        className="absolute inset-y-1 right-1 rounded-sm px-3 text-sm font-medium text-ink-soft transition-colors hover:bg-raised hover:text-ink"
      >
        {shown ? "Hide" : "Show"}
        <span className="sr-only"> password</span>
      </button>
    </div>
  );
}

/**
 * The password rules, ticked off as they're met. The byte limit only
 * appears when it's broken: it takes 73 plain characters to reach it.
 */
export function PasswordRules({ id, value }: { id: string; value: string }) {
  const { longEnough, shortEnough } = passwordChecks(value);
  return (
    <ul id={id} className="grid gap-1 text-sm">
      <li className={cn("flex items-center gap-1.5", longEnough ? "text-success" : "text-muted")}>
        {longEnough ? <CircleCheck className="size-4" aria-hidden /> : <Circle className="size-4" aria-hidden />}
        At least {limits.passwordMin} characters
        {longEnough && <span className="sr-only"> (done)</span>}
      </li>
      {!shortEnough && (
        <li className="flex items-center gap-1.5 text-danger">
          <CircleAlert className="size-4" aria-hidden />
          Too long: up to {limits.passwordMaxBytes} letters and digits, or fewer with accents or emoji
        </li>
      )}
    </ul>
  );
}
