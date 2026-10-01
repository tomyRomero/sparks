"use client";

import * as Tooltip from "@radix-ui/react-tooltip";

type HintProps = {
  label: string;
  side?: "top" | "right" | "bottom" | "left";
  /** One element that takes a ref, such as a link or a button. It keeps its own accessible name. */
  children: React.ReactElement;
};

/** A short label on hover and keyboard focus, for controls that show only an icon. */
export function Hint({ label, side = "right", children }: HintProps) {
  return (
    <Tooltip.Root>
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
