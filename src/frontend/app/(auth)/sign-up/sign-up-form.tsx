"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { CharacterCount } from "@/components/ui/character-count";
import { Field, fieldDescription } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { PasswordInput, PasswordRules } from "@/components/ui/password-input";
import { api } from "@/lib/api/client";
import { ApiError, errorMessage } from "@/lib/api/problem";
import { stopIfInvalid, useField } from "@/lib/forms";
import { limits } from "@/lib/limits";
import { useUsernameStatus } from "@/lib/queries/username";
import { displayNameProblem, emailProblem, passwordProblem, usernameProblem } from "@/lib/validation";

type Values = { email: string; username: string; displayName: string };
type State = {
  values: Values;
  fieldErrors: Partial<Record<keyof Values | "password", string>>;
  error?: string;
  signedIn?: boolean;
};

const empty: State = { values: { email: "", username: "", displayName: "" }, fieldErrors: {} };

export function SignUpForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const displayName = useField("", displayNameProblem);
  const username = useField("", usernameProblem);
  const email = useField("", emailProblem);
  const password = useField("", passwordProblem);
  const usernameStatus = useUsernameStatus(username.value, !username.problem);

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

    queryClient.clear();
    router.replace("/");
    router.refresh();
    return { values, fieldErrors: {}, signedIn: true };
  }, empty);

  // The server's word on a field holds until that field is changed.
  const { values, fieldErrors } = state;
  const serverError = (field: keyof Values, value: string) =>
    values[field] === value.trim() ? fieldErrors[field] : undefined;

  const usernameTaken = usernameStatus === "taken" ? `@${username.value} is taken. Try another.` : undefined;
  const usernameError = username.error ?? usernameTaken ?? serverError("username", username.value);
  const usernameSuccess = usernameStatus === "free" ? `@${username.value} is free.` : undefined;
  const usernameHint =
    usernameStatus === "checking"
      ? `Checking @${username.value}…`
      : "3 to 30 letters, digits or underscores. It's your profile's address.";
  const nameError = displayName.error ?? serverError("displayName", displayName.value);
  const emailError = email.error ?? serverError("email", email.value);
  const passwordError = password.error ?? fieldErrors.password;

  const busy = pending || state.signedIn === true;
  return (
    <form
      action={signUp}
      noValidate
      onSubmit={(event) =>
        stopIfInvalid(event, [
          ["displayName", displayName],
          ["username", username, usernameTaken],
          ["email", email],
          ["password", password],
        ])
      }
      className="mt-8 grid gap-5"
    >
      {state.error && <FormMessage tone="error">{state.error}</FormMessage>}
      <Field
        id="displayName"
        label="Name"
        error={nameError}
        aside={<CharacterCount length={displayName.value.length} max={limits.displayNameMax} />}
      >
        <Input
          id="displayName"
          name="displayName"
          autoComplete="name"
          required
          maxLength={limits.displayNameMax}
          {...displayName.props}
          {...fieldDescription("displayName", nameError)}
        />
      </Field>
      <Field id="username" label="Username" error={usernameError} success={usernameSuccess} hint={usernameHint}>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={limits.usernameMax}
          {...username.props}
          {...fieldDescription("username", usernameError, "message")}
        />
      </Field>
      <Field id="email" label="Email" error={emailError}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={limits.emailMax}
          {...email.props}
          {...fieldDescription("email", emailError)}
        />
      </Field>
      <Field id="password" label="Password" error={passwordError}>
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
        {busy ? "Creating your account…" : "Create account"}
      </Button>
    </form>
  );
}
