import { CalendarDays } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MessageButton } from "@/components/messages/message-button";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/api/types";
import { PresenceLine } from "./presence-line";
import { ProfileFollow, ProfileFollowButton } from "./profile-follow";
import { ProfileStats } from "./profile-stats";

const joined = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" });

type ProfileHeaderProps = {
  profile: Profile;
  viewer: "self" | "member" | "guest";
};

export function ProfileHeader({ profile, viewer }: ProfileHeaderProps) {
  return (
    <ProfileFollow profile={profile} signedIn={viewer !== "guest"}>
      <section
        aria-label="Profile"
        className="mb-4 overflow-hidden rounded-[18px] border border-line bg-surface pb-5 shadow-card"
      >
        <Cover profile={profile} />
        <div className="px-5 sm:px-6">
          <div className="relative -mt-12 flex items-end justify-between gap-4">
            <Avatar name={profile.displayName} src={profile.avatarUrl} size={96} className="ring-4 ring-surface" />
            {viewer === "self" ? (
              <Button asChild variant="secondary" size="sm">
                <Link href="/settings/profile">Edit profile</Link>
              </Button>
            ) : (
              // Guests see Follow too; it takes them to sign in.
              <div className="flex flex-wrap justify-end gap-2">
                {viewer === "member" && <MessageButton username={profile.username} iconOnPhones />}
                <ProfileFollowButton username={profile.username} />
              </div>
            )}
          </div>
          <p className="mt-4 font-display text-2xl leading-tight font-semibold tracking-tight">{profile.displayName}</p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="label-mono">@{profile.username}</span>
            {profile.followsMe && (
              <span className="rounded-md bg-raised px-1.5 py-0.5 font-mono text-[11px] text-ink-soft">
                Follows you
              </span>
            )}
          </p>
          {viewer === "member" && <PresenceLine userId={profile.id} />}
          {profile.bio && <p className="mt-3 max-w-prose leading-relaxed whitespace-pre-line">{profile.bio}</p>}
          <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
            <CalendarDays className="size-4" aria-hidden />
            Joined {joined.format(new Date(profile.joinedAt))}
          </p>
          <ProfileStats profile={profile} />
        </div>
      </section>
    </ProfileFollow>
  );
}

/**
 * The top of the page: their most liked picture when they have one, otherwise
 * a wash of colour picked from their name, so no two bare profiles match.
 */
function Cover({ profile }: { profile: Profile }) {
  if (profile.coverUrl) {
    return (
      <div aria-hidden className="relative h-32 bg-raised sm:h-40">
        <Image
          src={profile.coverUrl}
          alt=""
          fill
          sizes="720px"
          loading="eager"
          fetchPriority="high"
          className="object-cover"
        />
        <span className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/30" />
      </div>
    );
  }

  const hue = Array.from(profile.username).reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 360, 7);
  return (
    <div
      aria-hidden
      className="h-32 bg-raised sm:h-40"
      style={{
        backgroundImage: [
          `radial-gradient(120% 160% at 0% 0%, hsl(${hue} 85% 60% / 0.5), transparent 60%)`,
          `radial-gradient(120% 160% at 100% 100%, hsl(${(hue + 70) % 360} 85% 55% / 0.45), transparent 60%)`,
        ].join(", "),
      }}
    />
  );
}
