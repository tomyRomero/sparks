"use client";

import * as Menu from "@radix-ui/react-dropdown-menu";
import { Ellipsis, LogOut, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { menuContentStyle, menuItemStyle } from "@/components/ui/menu";
import { api } from "@/lib/api/client";
import type { CurrentUser } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/** The signed-in member, with their profile, settings and sign-out. */
export function ViewerMenu({ viewer }: { viewer: CurrentUser }) {
  const router = useRouter();

  async function signOut() {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      toast.error("Couldn't sign out. Try again.");
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <Menu.Root>
      <Menu.Trigger className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-raised">
        <Avatar name={viewer.displayName} src={viewer.avatarUrl} size={36} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{viewer.displayName}</span>
          <span className="block truncate label-mono">@{viewer.username}</span>
        </span>
        <Ellipsis className="size-4 text-muted" aria-hidden />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          side="top"
          align="start"
          sideOffset={8}
          className={cn(menuContentStyle, "min-w-52")}
        >
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
          <Menu.Item className={menuItemStyle} onSelect={signOut}>
            <LogOut className="size-4" aria-hidden /> Sign out
          </Menu.Item>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
