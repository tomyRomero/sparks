"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, fieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/problem";
import { limits } from "@/lib/limits";
import { FormMessage } from "../form-message";

type State = { error?: string; identifier: string };

export function SignInForm({ returnTo, passwordReset }: { returnTo: string; passwordReset: boolean }) {
  const router = useRouter();
  const [state, signIn, pending] = useActionState<State, FormData>(async (_, form) => {
    const identifier = String(form.get("identifier"));
    try {
      await api("/auth/login", { method: "POST", json: { identifier, password: form.get("password") } });
    } catch (error) {
      // Wrong credentials and a locked account each come with their own message.
      return { identifier, error: errorMessage(error) };
    }

    router.replace(returnTo);
    router.refresh();
    return { identifier };
  }, { identifier: "" });

  return (
    <form action={signIn} className="mt-8 grid gap-5">
      {passwordReset && !state.error && (
        <FormMessage tone="success">Your password is changed. Sign in with the new one.</FormMessage>
      )}
      {state.error && <FormMessage tone="error">{state.error}</FormMessage>}
      <Field id="identifier" label="Email or username">
        <Input
          id="identifier"
          name="identifier"
          autoComplete="username"
          defaultValue={state.identifier}
          required
          maxLength={limits.emailMax}
          {...fieldDescription("identifier")}
        />
      </Field>
      <Field id="password" label="Password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <div className="-mt-2 text-right text-sm">
        <Link href="/forgot-password" className="text-muted hover:text-ink hover:underline">
          Forgot your password?
        </Link>
      </div>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
