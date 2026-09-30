"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, fieldDescription } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/problem";
import { stopIfInvalid, useField } from "@/lib/forms";
import { limits } from "@/lib/limits";
import { requiredProblem } from "@/lib/validation";

type State = { error?: string; signedIn?: boolean };

const needsIdentifier = requiredProblem("Enter your email or username.");
const needsPassword = requiredProblem("Enter your password.");

export function SignInForm({ returnTo, passwordReset }: { returnTo: string; passwordReset: boolean }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const identifier = useField("", needsIdentifier);
  const password = useField("", needsPassword);
  const [state, signIn, pending] = useActionState<State, FormData>(async (_, form) => {
    try {
      await api("/auth/login", {
        method: "POST",
        json: { identifier: String(form.get("identifier")).trim(), password: form.get("password") },
      });
    } catch (error) {
      // Wrong credentials and a locked account each come with their own message.
      return { error: errorMessage(error) };
    }

    // A new member starts from an empty cache, never the last one's likes and counts.
    queryClient.clear();
    router.replace(returnTo);
    router.refresh();
    return { signedIn: true };
  }, {});

  const busy = pending || state.signedIn === true;
  return (
    <form
      action={signIn}
      noValidate
      onSubmit={(event) =>
        stopIfInvalid(event, [
          ["identifier", identifier],
          ["password", password],
        ])
      }
      className="mt-8 grid gap-5"
    >
      {passwordReset && !state.error && (
        <FormMessage tone="success">Your password is changed. Sign in with the new one.</FormMessage>
      )}
      {state.error && <FormMessage tone="error">{state.error}</FormMessage>}
      <Field id="identifier" label="Email or username" error={identifier.error}>
        <Input
          id="identifier"
          name="identifier"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={limits.emailMax}
          {...identifier.props}
          {...fieldDescription("identifier", identifier.error)}
        />
      </Field>
      <Field id="password" label="Password" error={password.error}>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          {...password.props}
          {...fieldDescription("password", password.error)}
        />
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
