"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, fieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { ApiError, errorMessage } from "@/lib/api/problem";
import { limits } from "@/lib/limits";
import { FormMessage } from "../form-message";

type Values = { email: string; username: string; displayName: string };
type State = { values: Values; fieldErrors: Partial<Record<keyof Values | "password", string>>; error?: string };

const empty: State = { values: { email: "", username: "", displayName: "" }, fieldErrors: {} };

export function SignUpForm() {
  const router = useRouter();
  const [state, signUp, pending] = useActionState<State, FormData>(async (_, form) => {
    const values: Values = {
      email: String(form.get("email")).trim(),
      username: String(form.get("username")).trim(),
      displayName: String(form.get("displayName")).trim(),
    };
    try {
      await api("/auth/signup", { method: "POST", json: { ...values, password: form.get("password") } });
    } catch (error) {
      if (error instanceof ApiError && error.code === "USERNAME_TAKEN") {
        return { values, fieldErrors: { username: error.message } };
      }
      if (error instanceof ApiError && error.code === "EMAIL_TAKEN") {
        return { values, fieldErrors: { email: error.message } };
      }
      if (error instanceof ApiError && error.status === 400) {
        return {
          values,
          fieldErrors: {
            email: error.fieldError("email"),
            username: error.fieldError("username"),
            displayName: error.fieldError("displayName"),
            password: error.fieldError("password"),
          },
        };
      }
      return { values, fieldErrors: {}, error: errorMessage(error) };
    }

    router.replace("/");
    router.refresh();
    return { values, fieldErrors: {} };
  }, empty);

  const { values, fieldErrors } = state;
  return (
    <form action={signUp} className="mt-8 grid gap-5">
      {state.error && <FormMessage tone="error">{state.error}</FormMessage>}
      <Field id="displayName" label="Name" error={fieldErrors.displayName}>
        <Input
          id="displayName"
          name="displayName"
          autoComplete="name"
          defaultValue={values.displayName}
          required
          maxLength={limits.displayNameMax}
          {...fieldDescription("displayName", fieldErrors.displayName)}
        />
      </Field>
      <Field
        id="username"
        label="Username"
        error={fieldErrors.username}
        hint="3 to 30 letters, digits or underscores. It's your profile's address."
      >
        <Input
          id="username"
          name="username"
          autoComplete="username"
          defaultValue={values.username}
          required
          pattern="[A-Za-z0-9_]{3,30}"
          {...fieldDescription("username", fieldErrors.username, "hint")}
        />
      </Field>
      <Field id="email" label="Email" error={fieldErrors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={values.email}
          required
          maxLength={limits.emailMax}
          {...fieldDescription("email", fieldErrors.email)}
        />
      </Field>
      <Field id="password" label="Password" error={fieldErrors.password} hint="At least 8 characters.">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={limits.passwordMin}
          {...fieldDescription("password", fieldErrors.password, "hint")}
        />
      </Field>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Creating your account…" : "Create account"}
      </Button>
    </form>
  );
}
