import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { MessageButton } from "@/components/messages/message-button";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/api/types";
import { PresenceLine } from "./presence-line";

const joined = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" });

type ProfileHeaderProps = {
  profile: Profile;
  viewer: "self" | "member" | "guest";
};

export function ProfileHeader({ profile, viewer }: ProfileHeaderProps) {
  return (
    <section
      aria-label="Profile"
      className="mb-4 overflow-hidden rounded-[18px] border border-line bg-surface pb-5 shadow-card"
    >
      <div aria-hidden className="h-24 bg-gradient-to-br from-brand-soft via-raised to-charge-soft" />
      <div className="px-5 sm:px-6">
        <div className="-mt-11 flex items-end justify-between gap-4">
          <Avatar name={profile.displayName} src={profile.avatarUrl} size={88} className="ring-4 ring-surface" />
          {viewer === "self" && (
            <Button asChild variant="secondary" size="sm">
              <Link href="/settings/profile">Edit profile</Link>
            </Button>
          )}
          {viewer === "member" && <MessageButton username={profile.username} />}
        </div>
        <p className="mt-4 font-display text-2xl leading-tight font-semibold tracking-tight">{profile.displayName}</p>
        <p className="label-mono">@{profile.username}</p>
        {viewer === "member" && <PresenceLine userId={profile.id} />}
        {profile.bio && <p className="mt-3 max-w-prose leading-relaxed whitespace-pre-line">{profile.bio}</p>}
        <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
          <CalendarDays className="size-4" aria-hidden />
          Joined {joined.format(new Date(profile.joinedAt))}
        </p>
        <p className="mt-3 flex gap-5 text-sm">
          <span>
            <strong className="font-semibold">{profile.postCount}</strong>{" "}
            <span className="text-muted">{profile.postCount === 1 ? "spark" : "sparks"}</span>
          </span>
          <span>
            <strong className="font-semibold">{profile.likesReceived}</strong>{" "}
            <span className="text-muted">{profile.likesReceived === 1 ? "like received" : "likes received"}</span>
          </span>
        </p>
      </div>
    </section>
  );
}
