"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import Image from "next/image";

type PictureViewerProps = {
  src: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The button that opens it, where focus goes back to when it closes. */
  children: React.ReactElement;
};

/**
 * The whole picture over a dark screen, since a spark crops it to the shape
 * of its kind. A click anywhere, the close button or Esc closes it.
 */
export function PictureViewer({ src, open, onOpenChange, children }: PictureViewerProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Trigger asChild>{children}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/90" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onClick={() => onOpenChange(false)}
          className="fixed inset-0 z-50 p-4 sm:p-10"
        >
          <DialogPrimitive.Title className="sr-only">The whole picture</DialogPrimitive.Title>
          <div className="relative size-full animate-menu-in">
            <Image src={src} alt="" fill sizes="100vw" className="object-contain" />
          </div>
          <DialogPrimitive.Close
            aria-label="Close"
            className="absolute top-3 right-3 inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <X className="size-5" aria-hidden />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
