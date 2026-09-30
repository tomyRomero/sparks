"use client";

import { usePathname } from "next/navigation";
import { TabNav } from "@/components/ui/tab-nav";

/** A profile's lists: what they shared, what they said, what they liked. */
export function ProfileTabs({ username }: { username: string }) {
  // Compared without case, since /u/Nova_Reyes shows the same profile as /u/nova_reyes.
  const pathname = usePathname().toLowerCase();
  const base = `/u/${username}`;
  const tabs = [
    { href: base, label: "Sparks" },
    { href: `${base}/comments`, label: "Comments" },
    { href: `${base}/likes`, label: "Likes" },
  ].map((tab) => ({ ...tab, current: pathname === tab.href.toLowerCase() }));

  return <TabNav label="Profile sections" tabs={tabs} />;
}
