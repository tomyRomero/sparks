"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/problem";
import { limits } from "@/lib/limits";

type State = { sent: boolean; error?: string };

export function ForgotPasswordForm() {
  const [state, requestLink, pending] = useActionState<State, FormData>(async (_, form) => {
    try {
      await api("/auth/forgot-password", { method: "POST", json: { email: String(form.get("email")).trim() } });
      return { sent: true };
    } catch (error) {
      return { sent: false, error: errorMessage(error) };
    }
  }, { sent: false });

  if (state.sent) {
    // The same answer whether or not the address has an account, so this
    // page can't be used to find out who's a member.
    return (
      <div className="mt-8">
        <FormMessage tone="success">
          If that address has an account, a reset link is on its way. It works for an hour.
        </FormMessage>
      </div>
    );
  }

  return (
    <form action={requestLink} className="mt-8 grid gap-5">
      {state.error && <FormMessage tone="error">{state.error}</FormMessage>}
      <Field id="email" label="Email">
        <Input id="email" name="email" type="email" autoComplete="email" required maxLength={limits.emailMax} />
      </Field>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
