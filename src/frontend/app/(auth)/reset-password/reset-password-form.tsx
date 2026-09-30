"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, fieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { ApiError, errorMessage } from "@/lib/api/problem";
import { limits } from "@/lib/limits";
import { FormMessage } from "../form-message";

type State = { error?: string; passwordError?: string; linkExpired?: boolean };

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [state, reset, pending] = useActionState<State, FormData>(async (_, form) => {
    try {
      await api("/auth/reset-password", { method: "POST", json: { token, password: form.get("password") } });
    } catch (error) {
      if (error instanceof ApiError && error.code === "INVALID_RESET_LINK") {
        return { error: error.message, linkExpired: true };
      }
      if (error instanceof ApiError && error.fieldError("password")) {
        return { passwordError: error.fieldError("password") };
      }
      return { error: errorMessage(error) };
    }

    router.replace("/sign-in?reset=1");
    return {};
  }, {});

  return (
    <form action={reset} className="mt-8 grid gap-5">
      {state.error && <FormMessage tone="error">{state.error}</FormMessage>}
      {state.linkExpired && (
        <Link href="/forgot-password" className="text-sm font-medium text-brand hover:underline">
          Request a new link
        </Link>
      )}
      <Field id="password" label="New password" error={state.passwordError} hint="At least 8 characters.">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={limits.passwordMin}
          {...fieldDescription("password", state.passwordError, "hint")}
        />
      </Field>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Saving…" : "Set new password"}
      </Button>
    </form>
  );
}
