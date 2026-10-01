import { Bell, House, MessageCircle, Search, SquarePen, UserRound, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Which unread count, if any, shows as a badge. */
  badge?: "activity" | "messages";
  /** Shown to signed-in members only. */
  membersOnly?: boolean;
  /** The sidebar shows it as its main button rather than in the list. */
  action?: boolean;
};

export function navItems(username: string | null): NavItem[] {
  const items: NavItem[] = [
    { href: "/", label: "Home", icon: House },
    { href: "/search", label: "Search", icon: Search },
    { href: "/create", label: "New spark", icon: SquarePen, membersOnly: true, action: true },
    { href: "/activity", label: "Activity", icon: Bell, badge: "activity", membersOnly: true },
    { href: "/messages", label: "Messages", icon: MessageCircle, badge: "messages", membersOnly: true },
    ...(username ? [{ href: `/u/${username}`, label: "Profile", icon: UserRound, membersOnly: true }] : []),
  ];
  return items.filter((item) => username || !item.membersOnly);
}

/** Whether a nav item is the current page (Home only on exactly "/"). */
export function isActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
