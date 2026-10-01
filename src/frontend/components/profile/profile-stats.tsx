"use client";

import Link from "next/link";
import type { Profile } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { useFollowerCount } from "./profile-follow";

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

/** Sparks, followers, following and likes received; the follow counts open their lists. */
export function ProfileStats({ profile }: { profile: Profile }) {
  const followers = useFollowerCount(profile.followerCount);
  const base = `/u/${profile.username}`;
  const stats = [
    { label: profile.postCount === 1 ? "Spark" : "Sparks", value: profile.postCount },
    { label: followers === 1 ? "Follower" : "Followers", value: followers, href: `${base}/followers` },
    { label: "Following", value: profile.followingCount, href: `${base}/following` },
    { label: profile.likesReceived === 1 ? "Like received" : "Likes received", value: profile.likesReceived },
  ];

  return (
    <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-line bg-line sm:grid-cols-4">
      {stats.map(({ label, value, href }) => (
        <div
          key={label}
          className={cn(
            "relative flex flex-col-reverse gap-0.5 bg-surface px-4 py-3",
            href && "transition-colors has-[a:hover]:bg-raised/60",
          )}
        >
          <dt className="label-mono">{label}</dt>
          <dd className="font-display text-xl font-bold tabular-nums" title={value.toLocaleString("en")}>
            {href ? (
              // The whole cell is the link's target.
              <Link
                href={href}
                className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-brand/50 focus-visible:after:ring-inset"
              >
                {compact.format(value)}
                <span className="sr-only"> {label.toLowerCase()}</span>
              </Link>
            ) : (
              compact.format(value)
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
