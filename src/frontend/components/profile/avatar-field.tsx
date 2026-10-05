"use client";

import { ImageUp } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/problem";
import type { Profile } from "@/lib/api/types";
import { AVATAR_MAX_BYTES, IMAGE_TYPES, imageProblem, megabytes } from "@/lib/images";
import { cn } from "@/lib/utils";

type AvatarFieldProps = {
  profile: Profile;
  onChanged: (profile: Profile) => void;
};

export function AvatarField({ profile, onChanged }: AvatarFieldProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function change(send: () => Promise<Profile>) {
    setBusy(true);
    setError(undefined);
    try {
      onChanged(await send());
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  function upload(file: File) {
    const problem = imageProblem(file, AVATAR_MAX_BYTES);
    if (problem) {
      setError(problem);
      return;
    }
    const form = new FormData();
    form.append("file", file);
    void change(() => api<Profile>("/users/me/avatar", { method: "PUT", body: form }));
  }

  return (
    <fieldset disabled={busy} aria-busy={busy} className="flex items-center gap-5">
      <legend className="sr-only">Profile picture</legend>
      <Avatar
        name={profile.displayName}
        src={profile.avatarUrl}
        size={88}
        className={cn(busy && "opacity-50 transition-opacity")}
      />
      <div className="grid gap-2">
        <div className="flex flex-wrap gap-2">
          <label
            className={cn(
              buttonVariants({ variant: "secondary", size: "sm" }),
              "cursor-pointer has-focus-visible:ring-2 has-focus-visible:ring-brand/40",
              busy && "pointer-events-none opacity-50",
            )}
          >
            <ImageUp aria-hidden />
            {busy ? "Saving…" : profile.avatarUrl ? "Change picture" : "Add a picture"}
            <input
              type="file"
              accept={IMAGE_TYPES.join(",")}
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) upload(file);
              }}
            />
          </label>
          {profile.avatarUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void change(() => api<Profile>("/users/me/avatar", { method: "DELETE" }))}
            >
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-muted">
          A square picture works best. PNG, JPEG, GIF or WebP, up to {megabytes(AVATAR_MAX_BYTES)} MB.
        </p>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </fieldset>
  );
}
