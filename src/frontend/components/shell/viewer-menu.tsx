"use client";

import * as Menu from "@radix-ui/react-dropdown-menu";
import { Ellipsis, LoaderCircle, LogOut, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { menuContentStyle, menuItemStyle } from "@/components/ui/menu";
import type { CurrentUser } from "@/lib/api/types";
import { useSignOut } from "@/lib/auth/use-sign-out";
import { cn } from "@/lib/utils";

/** The signed-in member, with their profile, settings and sign-out. Compact shows the picture alone. */
export function ViewerMenu({ viewer, compact = false }: { viewer: CurrentUser; compact?: boolean }) {
  const { signingOut, signOut } = useSignOut();

  return (
    <Menu.Root>
      {compact ? (
        <Menu.Trigger
          aria-label={`${viewer.displayName}: account menu`}
          className="rounded-full p-1 hover:bg-raised data-[state=open]:bg-raised"
        >
          <Avatar name={viewer.displayName} src={viewer.avatarUrl} size={40} />
        </Menu.Trigger>
      ) : (
        <Menu.Trigger className="flex w-full items-center gap-3 rounded-[14px] p-2.5 text-left hover:bg-raised data-[state=open]:bg-raised">
          <Avatar name={viewer.displayName} src={viewer.avatarUrl} size={40} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold">{viewer.displayName}</span>
            <span className="block truncate label-mono">@{viewer.username}</span>
          </span>
          <Ellipsis className="size-4 text-muted" aria-hidden />
        </Menu.Trigger>
      )}
      <Menu.Portal>
        <Menu.Content side="top" align="start" sideOffset={8} className={cn(menuContentStyle, "min-w-52")}>
          <Menu.Item asChild className={menuItemStyle}>
            <Link href={`/u/${viewer.username}`}>
              <UserRound className="size-4" aria-hidden /> Your profile
            </Link>
          </Menu.Item>
          <Menu.Item asChild className={menuItemStyle}>
            <Link href="/settings/profile">
              <Settings className="size-4" aria-hidden /> Edit profile
            </Link>
          </Menu.Item>
          <Menu.Separator className="my-1 h-px bg-line" />
          <Menu.Item
            className={menuItemStyle}
            aria-busy={signingOut || undefined}
            // The menu stays open, so "Signing out…" shows until the next page does.
            onSelect={(event) => {
              event.preventDefault();
              void signOut();
            }}
          >
            {signingOut ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : (
              <LogOut className="size-4" aria-hidden />
            )}
            {signingOut ? "Signing out…" : "Sign out"}
          </Menu.Item>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
