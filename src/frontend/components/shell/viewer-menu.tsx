"use client";

import * as Menu from "@radix-ui/react-dropdown-menu";
import { Check, Ellipsis, LoaderCircle, LogOut, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { menuContentStyle, menuItemStyle } from "@/components/ui/menu";
import type { CurrentUser } from "@/lib/api/types";
import { useSignOut } from "@/lib/auth/use-sign-out";
import { toTheme } from "@/lib/preferences";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { whenExpanded } from "./sidebar-styles";
import { themeOptions } from "./theme-switch";

export function ViewerMenu({ viewer }: { viewer: CurrentUser }) {
  const { signingOut, signOut } = useSignOut();
  const { theme, setTheme } = useTheme();

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`${viewer.displayName}: account menu`}
        className="flex w-full items-center justify-center gap-3 rounded-[14px] p-1.5 text-left transition-colors hover:bg-raised data-[state=open]:bg-raised lg:group-data-[expanded=true]/nav:justify-start lg:group-data-[expanded=true]/nav:p-2.5"
      >
        <Avatar name={viewer.displayName} src={viewer.avatarUrl} size={40} />
        <span className={cn("min-w-0 flex-1", whenExpanded)}>
          <span className="block truncate text-[15px] font-semibold">{viewer.displayName}</span>
          <span className="block truncate label-mono">@{viewer.username}</span>
        </span>
        <Ellipsis className={cn("size-4 text-muted", whenExpanded)} aria-hidden />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content side="top" align="start" sideOffset={8} className={cn(menuContentStyle, "min-w-56")}>
          <Menu.Item asChild className={menuItemStyle}>
            <Link href={`/u/${viewer.username}`}>
              <UserRound className="size-4" aria-hidden /> Your profile
            </Link>
          </Menu.Item>
          <Menu.Item asChild className={menuItemStyle}>
            <Link href="/settings/profile">
              <Settings className="size-4" aria-hidden /> Settings
            </Link>
          </Menu.Item>
          <Menu.Separator className="my-1 h-px bg-line" />
          <Menu.Label className="px-2.5 pt-1.5 pb-1 label-mono">Theme</Menu.Label>
          <Menu.RadioGroup value={theme} onValueChange={(value) => setTheme(toTheme(value))}>
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <Menu.RadioItem
                key={value}
                value={value}
                className={menuItemStyle}
                // Changing the theme is easier to judge with the menu still open.
                onSelect={(event) => event.preventDefault()}
              >
                <Icon className="size-4" aria-hidden />
                <span className="flex-1">{label}</span>
                <Menu.ItemIndicator>
                  <Check className="size-4 text-brand" aria-hidden />
                </Menu.ItemIndicator>
              </Menu.RadioItem>
            ))}
          </Menu.RadioGroup>
          <Menu.Separator className="my-1 h-px bg-line" />
          <Menu.Item
            className={menuItemStyle}
            aria-busy={signingOut || undefined}
            // The menu stays open, so "Signing out..." shows until the next page.
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
