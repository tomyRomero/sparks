"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import type { CurrentUser } from "@/lib/api/types";
import { useUnreadActivity, useUnreadMessages } from "@/lib/queries/unread";
import { cn } from "@/lib/utils";
import { isActive, navItems } from "./nav-items";
import { UnreadBadge } from "./unread-badge";
import { ViewerMenu } from "./viewer-menu";

/** The desktop navigation: every section, with unread counts. */
export function Sidebar({ viewer }: { viewer: CurrentUser | null }) {
  const pathname = usePathname();
  const signedIn = viewer !== null;
  const { data: unreadActivity } = useUnreadActivity(signedIn);
  const { data: unreadMessages } = useUnreadMessages(signedIn);
  const counts = { activity: unreadActivity, messages: unreadMessages };

  return (
    <nav aria-label="Main" className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col px-4 py-6 md:flex">
      <Link href="/" className="mb-8 px-2">
        <Logo />
      </Link>
      <ul className="grid gap-1">
        {navItems(viewer?.username ?? null).map((item) => {
          const active = isActive(item.href, pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 font-medium text-ink-soft transition-colors hover:bg-raised hover:text-ink",
                  active && "bg-brand-soft text-brand hover:bg-brand-soft hover:text-brand",
                )}
              >
                <item.icon className="size-5" aria-hidden />
                <span className="flex-1">{item.label}</span>
                {item.badge && <UnreadBadge count={counts[item.badge]} />}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto">
        {viewer ? (
          <ViewerMenu viewer={viewer} />
        ) : (
          <div className="grid gap-2 rounded-lg border border-line bg-surface p-4">
            <p className="text-sm text-ink-soft">Join to post, like, comment and chat.</p>
            <Button asChild size="sm">
              <Link href="/sign-up">Create account</Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link href={`/sign-in?next=${encodeURIComponent(pathname)}`}>Sign in</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
