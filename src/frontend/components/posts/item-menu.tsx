"use client";

import * as Menu from "@radix-ui/react-dropdown-menu";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import { menuContentStyle, menuDangerItemStyle, menuItemStyle } from "@/components/ui/menu";
import { cn } from "@/lib/utils";

type ItemMenuProps = {
  /** What the menu is for, as a screen reader hears the button: "Spark options". */
  label: string;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
};

/** The author's own actions on a spark or comment. */
export function ItemMenu({ label, onEdit, onDelete, className }: ItemMenuProps) {
  return (
    // Not modal: a modal menu that hands focus to the delete dialog can leave
    // the page unclickable once both close.
    <Menu.Root modal={false}>
      <Menu.Trigger
        aria-label={label}
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-raised hover:text-ink data-[state=open]:bg-raised",
          className,
        )}
      >
        <Ellipsis className="size-4" aria-hidden />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content align="end" sideOffset={4} className={menuContentStyle}>
          <Menu.Item className={menuItemStyle} onSelect={onEdit}>
            <Pencil className="size-4" aria-hidden /> Edit
          </Menu.Item>
          <Menu.Item className={menuDangerItemStyle} onSelect={onDelete}>
            <Trash2 className="size-4" aria-hidden /> Delete
          </Menu.Item>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
