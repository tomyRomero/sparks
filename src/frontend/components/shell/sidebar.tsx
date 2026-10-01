"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BoltMark, Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/hint";
import { PendingIcon } from "@/components/ui/pending-icon";
import type { CurrentUser } from "@/lib/api/types";
import { useUnreadActivity, useUnreadMessages } from "@/lib/queries/unread";
import { cn } from "@/lib/utils";
import { isActive, navItems } from "./nav-items";
import { UnreadBadge } from "./unread-badge";
import { ViewerMenu } from "./viewer-menu";

type SidebarProps = {
  viewer: CurrentUser | null;
  /** Icons only, for pages that need the width (the messenger). */
  compact?: boolean;
};

/** The desktop navigation: every section with its unread count, the way to write, and the account. */
export function Sidebar({ viewer, compact = false }: SidebarProps) {
  const pathname = usePathname();
  const signedIn = viewer !== null;
  const { data: unreadActivity } = useUnreadActivity(signedIn);
  const { data: unreadMessages } = useUnreadMessages(signedIn);
  const counts = { activity: unreadActivity, messages: unreadMessages };
  const items = navItems(viewer?.username ?? null);
  const sections = items.filter((item) => !item.action);
  const action = items.find((item) => item.action);

  if (compact) {
    return (
      <nav
        aria-label="Main"
        className="sticky top-0 hidden h-dvh w-[76px] shrink-0 flex-col items-center gap-2 border-r border-line bg-surface py-5 md:flex"
      >
        <Hint label="Home">
          <Link href="/" aria-label="Sparks home" className="mb-3 rounded-md">
            <BoltMark className="size-10 rounded-[11px]" />
          </Link>
        </Hint>
        {sections.map((item) => {
          const active = isActive(item.href, pathname);
          const count = item.badge ? counts[item.badge] : undefined;
          return (
            <Hint key={item.href} label={item.label}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={count ? `${item.label}, ${count} unread` : item.label}
                className={cn(
                  "relative inline-flex size-12 items-center justify-center rounded-[14px] text-ink-soft transition-colors hover:bg-raised hover:text-ink",
                  active && "bg-brand-soft text-brand hover:bg-brand-soft hover:text-brand",
                )}
              >
                <PendingIcon icon={item.icon} className="size-[22px]" />
                <UnreadBadge count={count} className="absolute top-1.5 right-1 border-2 border-surface" />
              </Link>
            </Hint>
          );
        })}
        {action && (
          <Hint label={action.label}>
            <Link
              href={action.href}
              aria-label={action.label}
              className="mt-2 inline-flex size-12 items-center justify-center rounded-full bg-brand text-brand-ink transition-colors hover:bg-brand-hover"
            >
              <PendingIcon icon={action.icon} className="size-[22px]" />
            </Link>
          </Hint>
        )}
        <div className="mt-auto">{viewer && <ViewerMenu viewer={viewer} compact />}</div>
      </nav>
    );
  }

  return (
    <nav aria-label="Main" className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col gap-6 px-3 py-6 md:flex">
      <Link href="/" className="self-start rounded-md px-3" aria-label="Sparks home">
        <Logo />
      </Link>
      <ul className="grid gap-1">
        {sections.map((item) => {
          const active = isActive(item.href, pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-[46px] items-center gap-3.5 rounded-xl px-3.5 text-base text-ink-soft transition-colors hover:bg-raised hover:text-ink",
                  active && "bg-brand-soft font-semibold text-brand hover:bg-brand-soft hover:text-brand",
                )}
              >
                <PendingIcon icon={item.icon} className="size-[22px]" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <UnreadBadge count={counts[item.badge]} className="h-[22px] min-w-[22px] text-[11px]" spoken />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      {action && (
        <Button asChild size="lg" className="h-[50px] rounded-[14px] text-[15.5px]">
          <Link href={action.href}>
            <PendingIcon icon={action.icon} className="size-[19px]" />
            {action.label}
          </Link>
        </Button>
      )}
      <div className="mt-auto">
        {viewer ? (
          <ViewerMenu viewer={viewer} />
        ) : (
          <div className="grid gap-2 rounded-[18px] border border-line bg-surface p-4 shadow-card">
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
