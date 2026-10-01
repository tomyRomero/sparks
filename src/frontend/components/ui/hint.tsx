"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import { useState } from "react";

type HintProps = {
  label: string;
  side?: "top" | "right" | "bottom" | "left";
  /** One element that takes a ref, such as a link or a button. It keeps its own accessible name. */
  children: React.ReactElement;
  /** Never shows, for when the label is already on screen. */
  disabled?: boolean;
};

export function Hint({ label, side = "right", children, disabled = false }: HintProps) {
  // Always controlled: \`disabled\` can change after mount (the sidebar
  // collapsing), and Radix warns when a tooltip switches modes.
  const [open, setOpen] = useState(false);
  return (
    <Tooltip.Root open={open && !disabled} onOpenChange={setOpen}>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side={side}
          sideOffset={8}
          className="z-50 rounded-md bg-ink px-2.5 py-1.5 text-xs font-medium text-canvas shadow-lg"
        >
          {label}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
