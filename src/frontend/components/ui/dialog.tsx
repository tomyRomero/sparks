"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** One line under the title; also what a screen reader hears after it. */
  description?: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * A modal panel with a title and a close button. Focus moves in when it
 * opens, stays inside, and goes back where it was when it closes; Escape and
 * a click outside close it. On a phone it rises from the bottom edge.
 */
export function Dialog({ open, onOpenChange, title, description, children, className }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          // Without a description, Radix would warn; the title alone names it.
          {...(!description && { "aria-describedby": undefined })}
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-[20px] border border-line bg-surface shadow-xl",
            "sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:w-[calc(100%-2rem)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[20px]",
            className,
          )}
        >
          <div className="flex items-start gap-3 px-5 pt-5 pb-3">
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="font-display text-lg font-semibold tracking-tight">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="mt-1 text-sm text-muted">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              aria-label="Close"
              className="-mt-1 -mr-1 inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-raised hover:text-ink"
            >
              <X className="size-5" aria-hidden />
            </DialogPrimitive.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
