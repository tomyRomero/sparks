"use client";

import { usePresence } from "@/lib/queries/presence";
import { lastActive } from "@/lib/time";

/** Whether a member is online, or when they last were; live. Nothing until it's known. */
export function PresenceLine({ userId }: { userId: number }) {
  const presence = usePresence([userId])?.get(userId);
  if (!presence) return null;
  if (presence.online) {
    return (
      <p className="mt-1 flex items-center gap-1.5 font-mono text-[11.5px] text-success">
        <span aria-hidden className="size-2 rounded-full bg-online" />
        Online
      </p>
    );
  }
  return presence.lastSeenAt ? (
    <p className="mt-1 font-mono text-[11.5px] text-muted" suppressHydrationWarning>
      {lastActive(presence.lastSeenAt)}
    </p>
  ) : null;
}
