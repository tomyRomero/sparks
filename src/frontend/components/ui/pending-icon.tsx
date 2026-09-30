"use client";

import { LoaderCircle, type LucideIcon } from "lucide-react";
import { useLinkStatus } from "next/link";
import { cn } from "@/lib/utils";

/**
 * A link's icon that turns into a spinner while the page it opens is on its
 * way, in the same box so nothing shifts. It must sit inside a Link. In
 * production most pages are prefetched and this never shows; it covers slow
 * connections and pages that weren't prefetched.
 */
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
