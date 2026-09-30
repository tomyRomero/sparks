"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, fieldDescription } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { Input, Textarea } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { ApiError, errorMessage } from "@/lib/api/problem";
import type { Profile } from "@/lib/api/types";
import { limits } from "@/lib/limits";
import { queryKeys } from "@/lib/queries/keys";
import { AvatarField } from "./avatar-field";

type Values = { displayName: string; bio: string };
type State = { values: Values; fieldErrors: Partial<Record<keyof Values, string>>; error?: string };

/** The member's own profile: picture, name and bio. */
export function ProfileForm({ profile: initial }: { profile: Profile }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState(initial);

  // Names and pictures are baked into every cached spark and comment, so
  // those lists reload the next time they're shown; the sidebar reloads now.
  function changed(updated: Profile) {
    setProfile(updated);
    void queryClient.invalidateQueries({ queryKey: queryKeys.posts });
    void queryClient.invalidateQueries({ queryKey: queryKeys.comments });
    router.refresh();
  }

  const [state, save, pending] = useActionState<State, FormData>(
    async (_, form) => {
      const values: Values = {
        displayName: String(form.get("displayName")).trim(),
        bio: String(form.get("bio")).trim(),
      };
      try {
        changed(await api<Profile>("/users/me", { method: "PATCH", json: values }));
      } catch (error) {
        if (error instanceof ApiError && error.status === 400) {
          return {
            values,
            fieldErrors: { displayName: error.fieldError("displayName"), bio: error.fieldError("bio") },
          };
        }
        return { values, fieldErrors: {}, error: errorMessage(error) };
      }
      toast.success("Profile saved");
      return { values, fieldErrors: {} };
    },
    { values: { displayName: initial.displayName, bio: initial.bio ?? "" }, fieldErrors: {} },
  );

  const { values, fieldErrors } = state;
  return (
    <div className="grid gap-8 px-4 py-6 sm:px-6">
      <AvatarField profile={profile} onChanged={changed} />

      <form action={save} className="grid gap-5">
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
          id="bio"
          label="Bio"
          error={fieldErrors.bio}
          hint={`A line or two about you. Up to ${limits.bioMax} characters.`}
        >
          <Textarea
            id="bio"
            name="bio"
            defaultValue={values.bio}
            maxLength={limits.bioMax}
            rows={4}
            {...fieldDescription("bio", fieldErrors.bio, "hint")}
          />
        </Field>
        <p className="text-sm text-muted">
          Your username, <span className="font-mono">@{profile.username}</span>, stays the same.
        </p>
        <div className="flex items-center justify-end gap-3 border-t border-line pt-5">
          <Button asChild variant="ghost">
            <Link href={`/u/${profile.username}`}>View profile</Link>
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </form>
    </div>
  );
}
