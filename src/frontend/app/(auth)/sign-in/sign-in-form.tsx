"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, fieldDescription } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/problem";
import { limits } from "@/lib/limits";

type State = { error?: string; identifier: string; signedIn?: boolean };

export function SignInForm({ returnTo, passwordReset }: { returnTo: string; passwordReset: boolean }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [state, signIn, pending] = useActionState<State, FormData>(
    async (_, form) => {
      const identifier = String(form.get("identifier"));
      try {
        await api("/auth/login", { method: "POST", json: { identifier, password: form.get("password") } });
      } catch (error) {
        // Wrong credentials and a locked account each come with their own message.
        return { identifier, error: errorMessage(error) };
      }

      // A new member starts from an empty cache, never the last one's likes and counts.
      queryClient.clear();
      router.replace(returnTo);
      router.refresh();
      return { identifier, signedIn: true };
    },
    { identifier: "" },
  );

  const busy = pending || state.signedIn === true;
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
      {/* Still busy after the answer, until the next page replaces this one. */}
      <Button type="submit" size="lg" disabled={busy} aria-busy={busy}>
        {busy && <LoaderCircle className="animate-spin" aria-hidden />}
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
