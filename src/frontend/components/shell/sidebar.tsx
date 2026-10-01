"use client";

import { LogIn, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BoltMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/hint";
import { PendingIcon } from "@/components/ui/pending-icon";
import type { CurrentUser } from "@/lib/api/types";
import { SIDEBAR_COOKIE, savePreference } from "@/lib/preferences";
import { useUnreadActivity, useUnreadMessages } from "@/lib/queries/unread";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { isActive, navItems } from "./nav-items";
import { alignWhenExpanded, whenExpanded } from "./sidebar-styles";
import { ThemeSwitch } from "./theme-switch";
import { UnreadBadge } from "./unread-badge";
import { ViewerMenu } from "./viewer-menu";

type SidebarProps = {
  viewer: CurrentUser | null;
  /** The member's choice, from a cookie. Below 1024px it's icons only regardless. */
  collapsed: boolean;
};

export function Sidebar({ viewer, collapsed: initiallyCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(initiallyCollapsed);
  const wide = useMediaQuery("(min-width: 1024px)");
  const iconsOnly = collapsed || !wide;
  const signedIn = viewer !== null;
  const { data: unreadActivity } = useUnreadActivity(signedIn);
  const { data: unreadMessages } = useUnreadMessages(signedIn);
  const counts = { activity: unreadActivity, messages: unreadMessages };
  const items = navItems(viewer?.username ?? null);
  const sections = items.filter((item) => !item.action);
  const action = items.find((item) => item.action);

  function toggle() {
    setCollapsed(!collapsed);
    savePreference(SIDEBAR_COOKIE, collapsed ? "expanded" : "collapsed");
  }

  return (
    <nav
      aria-label="Main"
      data-expanded={!collapsed}
      className="group/nav sticky top-0 hidden h-dvh w-[76px] shrink-0 flex-col gap-1 border-r border-line bg-surface/60 px-3 py-5 transition-[width] duration-200 ease-out md:flex lg:data-[expanded=true]:w-[264px]"
    >
      <Link
        href="/"
        aria-label="Sparks home"
        className={cn("mb-5 flex items-center gap-2.5 rounded-xl px-1", alignWhenExpanded)}
      >
        <BoltMark className="size-10 shrink-0 rounded-[11px]" />
        <span className={cn("font-wordmark text-[26px] leading-none text-ink", whenExpanded)}>Sparks</span>
      </Link>

      <ul className="grid gap-1">
        {sections.map((item) => {
          const active = isActive(item.href, pathname);
          const count = item.badge ? counts[item.badge] : undefined;
          return (
            <li key={item.href}>
              <Hint label={item.label} disabled={!iconsOnly}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  aria-label={count ? `${item.label}, ${count} unread` : item.label}
                  className={cn(
                    "relative flex h-12 items-center gap-3.5 rounded-[14px] px-3 text-[15.5px] text-ink-soft transition-colors hover:bg-raised hover:text-ink",
                    alignWhenExpanded,
                    active && "bg-brand-soft font-semibold text-brand hover:bg-brand-soft hover:text-brand",
                  )}
                >
                  <PendingIcon icon={item.icon} className="size-[22px] shrink-0" />
                  <span className={cn("flex-1 truncate", whenExpanded)}>{item.label}</span>
                  <UnreadBadge
                    count={count}
                    className="absolute top-1.5 right-1.5 border-2 border-surface lg:group-data-[expanded=true]/nav:static lg:group-data-[expanded=true]/nav:border-0"
                  />
                </Link>
              </Hint>
            </li>
          );
        })}
      </ul>

      {action && (
        <Hint label={action.label} disabled={!iconsOnly}>
          <Link
            href={action.href}
            aria-label={action.label}
            className="mt-3 inline-flex h-12 w-12 items-center justify-center gap-2 self-center rounded-full bg-brand text-[15.5px] font-semibold text-brand-ink shadow-[0_8px_20px_-10px_var(--brand)] transition-[background-color,transform] hover:bg-brand-hover active:scale-[0.97] lg:group-data-[expanded=true]/nav:w-full lg:group-data-[expanded=true]/nav:rounded-[14px]"
          >
            <PendingIcon icon={action.icon} className="size-5 shrink-0" />
            <span className={whenExpanded}>{action.label}</span>
          </Link>
        </Hint>
      )}

      <div className="mt-auto grid gap-2">
        <Hint label={collapsed ? "Expand sidebar" : "Collapse sidebar"} disabled={!collapsed}>
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "hidden h-10 items-center gap-3 rounded-xl px-3 text-sm text-muted transition-colors hover:bg-raised hover:text-ink lg:flex",
              alignWhenExpanded,
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-5 shrink-0" aria-hidden />
            ) : (
              <PanelLeftClose className="size-5 shrink-0" aria-hidden />
            )}
            <span className={whenExpanded}>Collapse</span>
          </button>
        </Hint>

        {viewer ? (
          <ViewerMenu viewer={viewer} />
        ) : (
          <>
            <div
              className={cn(
                "hidden gap-2 rounded-[18px] border border-line bg-surface p-4 shadow-card lg:group-data-[expanded=true]/nav:grid",
              )}
            >
              <p className="text-sm text-ink-soft">Join to post, like, comment and chat.</p>
              <Button asChild size="sm">
                <Link href="/sign-up">Create account</Link>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <Link href={`/sign-in?next=${encodeURIComponent(pathname)}`}>Sign in</Link>
              </Button>
              <ThemeSwitch className="mt-1 self-start" />
            </div>
            <Hint label="Sign in" disabled={!iconsOnly}>
              <Link
                href={`/sign-in?next=${encodeURIComponent(pathname)}`}
                aria-label="Sign in"
                className="inline-flex size-12 items-center justify-center self-center rounded-[14px] text-ink-soft hover:bg-raised hover:text-ink lg:group-data-[expanded=true]/nav:hidden"
              >
                <LogIn className="size-[22px]" aria-hidden />
              </Link>
            </Hint>
          </>
        )}
      </div>
    </nav>
  );
}
