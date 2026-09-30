"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** A profile's lists: what they shared, what they said, what they liked. */
export function ProfileTabs({ username }: { username: string }) {
  const pathname = usePathname();
  const base = `/u/${username}`;
  const tabs = [
    { href: base, label: "Sparks" },
    { href: `${base}/comments`, label: "Comments" },
    { href: `${base}/likes`, label: "Likes" },
  ];

  return (
    <nav aria-label="Profile sections" className="border-b border-line">
      <ul className="flex px-2 sm:px-4">
        {tabs.map((tab) => {
          // Compared without case, since /u/Nova_Reyes shows the same profile as /u/nova_reyes.
          const current = pathname.toLowerCase() === tab.href.toLowerCase();
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "relative inline-flex h-12 items-center px-4 text-sm font-medium text-muted transition-colors hover:text-ink",
                  current && "text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-brand",
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
