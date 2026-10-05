"use client";

import * as Menu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, Shapes } from "lucide-react";
import { chipStyle } from "@/components/ui/chip";
import { menuContentStyle, menuItemStyle } from "@/components/ui/menu";
import type { SparkKind } from "@/lib/api/types";
import { toggleKind } from "@/lib/feed";
import { kindInfo, kinds } from "@/lib/kinds";
import { cn } from "@/lib/utils";

type KindMenuProps = {
  selected: SparkKind[];
  onChange: (kinds: SparkKind[]) => void;
};

/** Picks any number of kinds. The menu stays open, so the list behind it changes as you pick. */
export function KindMenu({ selected, onChange }: KindMenuProps) {
  const only = selected.length === 1 ? kindInfo(selected[0]) : null;
  const Icon = only?.icon ?? Shapes;
  const summary = selected.length === 0 ? "All kinds" : (only?.label ?? `${selected.length} kinds`);
  const item = cn(menuItemStyle, "data-[state=checked]:text-ink [&_svg]:size-4 [&_svg]:shrink-0");

  return (
    <Menu.Root>
      <Menu.Trigger className={chipStyle(selected.length > 0)} aria-label={`Kinds: ${summary}`}>
        <Icon aria-hidden />
        {summary}
        <ChevronDown className="-me-1 opacity-60" aria-hidden />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          align="start"
          sideOffset={8}
          collisionPadding={12}
          className={cn(menuContentStyle, "w-[min(23rem,calc(100vw-1.5rem))]")}
        >
          <Menu.CheckboxItem
            checked={selected.length === 0}
            onCheckedChange={() => onChange([])}
            onSelect={(event) => event.preventDefault()}
            className={item}
          >
            <Shapes aria-hidden />
            <span className="flex-1">All kinds</span>
            <Menu.ItemIndicator>
              <Check className="text-brand" aria-hidden />
            </Menu.ItemIndicator>
          </Menu.CheckboxItem>
          <Menu.Separator className="my-1 h-px bg-line" />
          <Menu.Group className="grid grid-cols-2 gap-0.5">
            {kinds.map(({ kind, label, icon: KindIcon }) => (
              <Menu.CheckboxItem
                key={kind}
                checked={selected.includes(kind)}
                onCheckedChange={() => onChange(toggleKind(selected, kind))}
                onSelect={(event) => event.preventDefault()}
                className={item}
              >
                <KindIcon aria-hidden />
                <span className="flex-1 truncate">{label}</span>
                <Menu.ItemIndicator>
                  <Check className="text-brand" aria-hidden />
                </Menu.ItemIndicator>
              </Menu.CheckboxItem>
            ))}
          </Menu.Group>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
