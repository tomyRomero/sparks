"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CharacterCount } from "@/components/ui/character-count";
import { Field, fieldDescription } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { Input, Textarea } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { ApiError, errorMessage } from "@/lib/api/problem";
import type { Profile } from "@/lib/api/types";
import { stopIfInvalid, useField } from "@/lib/forms";
import { limits } from "@/lib/limits";
import { queryKeys } from "@/lib/queries/keys";
import { displayNameProblem } from "@/lib/validation";
import { AvatarField } from "./avatar-field";

type Values = { displayName: string; bio: string };
type State = { values: Values; fieldErrors: Partial<Record<keyof Values, string>>; error?: string };

/** The member's own profile: picture, name and bio. */
export function ProfileForm({ profile: initial }: { profile: Profile }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState(initial);
  const displayName = useField(initial.displayName, displayNameProblem);
  const bio = useField(initial.bio ?? "", () => undefined);

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

  // The server's word on a field holds until that field is changed.
  const { values, fieldErrors } = state;
  const nameError =
    displayName.error ?? (values.displayName === displayName.value.trim() ? fieldErrors.displayName : undefined);
  const bioError = values.bio === bio.value.trim() ? fieldErrors.bio : undefined;
  return (
    <div className="grid gap-8 px-4 py-6 sm:px-6">
      <AvatarField profile={profile} onChanged={changed} />

      <form
        action={save}
        noValidate
        onSubmit={(event) => stopIfInvalid(event, [["displayName", displayName]])}
        className="grid gap-5"
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
        <Field
          id="bio"
          label="Bio"
          error={bioError}
          hint="A line or two about you."
          aside={<CharacterCount length={bio.value.length} max={limits.bioMax} />}
        >
          <Textarea
            id="bio"
            name="bio"
            maxLength={limits.bioMax}
            rows={4}
            {...bio.props}
            {...fieldDescription("bio", bioError, "hint")}
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
