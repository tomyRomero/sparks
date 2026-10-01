"use client";

import { LoaderCircle, type LucideIcon } from "lucide-react";
import { useLinkStatus } from "next/link";
import { cn } from "@/lib/utils";

/** A Link's icon that becomes a spinner while its page loads. Must be inside a Link. */
export function PendingIcon({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  const { pending } = useLinkStatus();
  return (
    <span className={cn("relative inline-flex shrink-0", className)} aria-hidden>
      <Icon className={cn("size-full transition-opacity", pending && "opacity-0")} />
      <LoaderCircle
        className={cn("absolute inset-0 size-full animate-spin opacity-0 transition-opacity", pending && "opacity-100")}
      />
    </span>
  );
}
