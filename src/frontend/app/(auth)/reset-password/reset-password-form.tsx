"use client";

import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { PasswordInput, PasswordRules } from "@/components/ui/password-input";
import { api } from "@/lib/api/client";
import { ApiError, errorMessage } from "@/lib/api/problem";
import { stopIfInvalid, useField } from "@/lib/forms";
import { passwordProblem } from "@/lib/validation";

type State = { error?: string; passwordError?: string; linkExpired?: boolean; done?: boolean };

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const password = useField("", passwordProblem);
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
    return { done: true };
  }, {});

  const passwordError = password.error ?? state.passwordError;
  const busy = pending || state.done === true;
  return (
    <form
      action={reset}
      noValidate
      onSubmit={(event) => stopIfInvalid(event, [["password", password]])}
      className="mt-8 grid gap-5"
    >
      {state.error && <FormMessage tone="error">{state.error}</FormMessage>}
      {state.linkExpired && (
        <Link href="/forgot-password" className="text-sm font-medium text-brand hover:underline">
          Request a new link
        </Link>
      )}
      <Field id="password" label="New password" error={passwordError}>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          {...password.props}
          aria-invalid={passwordError ? true : undefined}
          aria-describedby={passwordError ? "password-message password-rules" : "password-rules"}
        />
        <PasswordRules id="password-rules" value={password.value} />
      </Field>
      <Button type="submit" size="lg" disabled={busy} aria-busy={busy}>
        {busy && <LoaderCircle className="animate-spin" aria-hidden />}
        {busy ? "Saving…" : "Set new password"}
      </Button>
    </form>
  );
}
