"use client";

import { usePathname } from "next/navigation";
import { TabNav } from "@/components/ui/tab-nav";
import type { Profile } from "@/lib/api/types";

export function FollowTabs({ profile }: { profile: Profile }) {
  const pathname = usePathname().toLowerCase();
  const base = `/u/${profile.username}`;
  const tabs = [
    { href: `${base}/followers`, label: "Followers", count: profile.followerCount },
    { href: `${base}/following`, label: "Following", count: profile.followingCount },
  ].map((tab) => ({ ...tab, current: pathname === tab.href.toLowerCase() }));

  return <TabNav label="Follows" tabs={tabs} />;
}
