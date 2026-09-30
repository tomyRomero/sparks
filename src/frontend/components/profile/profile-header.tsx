import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/api/types";

const joined = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" });

/** Who a member is: picture, names, bio, when they joined, and what they've shared. */
export function ProfileHeader({ profile, isViewer }: { profile: Profile; isViewer: boolean }) {
  return (
    <section aria-label="Profile" className="px-4 pt-6 pb-4 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <Avatar name={profile.displayName} src={profile.avatarUrl} size={88} />
        {isViewer && (
          <Button asChild variant="secondary" size="sm">
            <Link href="/settings/profile">Edit profile</Link>
          </Button>
        )}
      </div>
      <p className="mt-4 font-display text-2xl leading-tight font-semibold tracking-tight">{profile.displayName}</p>
      <p className="label-mono">@{profile.username}</p>
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
    </section>
  );
}
