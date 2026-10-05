export const menuContentStyle =
  "z-50 min-w-44 origin-(--radix-dropdown-menu-content-transform-origin) animate-menu-in rounded-xl border border-line bg-surface p-1.5 shadow-[0_16px_40px_-16px_var(--shadow-far)]";

const menuItemBase = "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none";

export const menuItemStyle = `${menuItemBase} text-ink-soft data-highlighted:bg-raised data-highlighted:text-ink`;

export const menuDangerItemStyle = `${menuItemBase} text-danger data-highlighted:bg-danger-soft`;
