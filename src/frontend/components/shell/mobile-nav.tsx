"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CurrentUser } from "@/lib/api/types";
import { useUnreadActivity, useUnreadMessages } from "@/lib/queries/unread";
import { cn } from "@/lib/utils";
import { isActive, navItems } from "./nav-items";
import { UnreadBadge } from "./unread-badge";

/** The phone navigation: icons along the bottom edge. */
export function MobileNav({ viewer }: { viewer: CurrentUser | null }) {
  const pathname = usePathname();
  const signedIn = viewer !== null;
  const { data: unreadActivity } = useUnreadActivity(signedIn);
  const { data: unreadMessages } = useUnreadMessages(signedIn);
  const counts = { activity: unreadActivity, messages: unreadMessages };

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="flex justify-around">
        {navItems(viewer?.username ?? null).map((item) => {
          const active = isActive(item.href, pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                className={cn("relative flex size-14 items-center justify-center text-muted", active && "text-brand")}
              >
                <item.icon className="size-6" aria-hidden />
                {item.badge && <UnreadBadge count={counts[item.badge]} className="absolute top-2 right-2" />}
              </Link>
            </li>
          );
        })}
        {!viewer && (
          <li>
            <Link
              href={`/sign-in?next=${encodeURIComponent(pathname)}`}
              className="flex h-14 items-center px-3 text-sm font-medium text-brand"
            >
              Sign in
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
