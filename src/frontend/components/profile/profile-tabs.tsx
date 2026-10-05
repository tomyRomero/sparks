"use client";

import { usePathname } from "next/navigation";
import { TabNav } from "@/components/ui/tab-nav";
import type { Profile } from "@/lib/api/types";

export function ProfileTabs({ profile }: { profile: Profile }) {
  // Compared without case, since /u/Nova_Reyes shows the same profile as /u/nova_reyes.
  const pathname = usePathname().toLowerCase();
  const base = `/u/${profile.username}`;
  const tabs = [
    { href: base, label: "Sparks" },
    { href: `${base}/pictures`, label: "Pictures", count: profile.pictureCount },
    { href: `${base}/comments`, label: "Comments", count: profile.commentCount },
    { href: `${base}/likes`, label: "Likes" },
  ].map((tab) => ({ ...tab, current: pathname === tab.href.toLowerCase() }));

  return <TabNav label="Profile sections" tabs={tabs} />;
}
