"use client";

import { MessageButton } from "@/components/messages/message-button";
import { Avatar } from "@/components/ui/avatar";
import { IntentLink } from "@/components/ui/intent-link";
import { Skeleton } from "@/components/ui/skeleton";
import { useMembersAround } from "@/lib/queries/presence";
import { lastActive } from "@/lib/time";
import { cn } from "@/lib/utils";

export function WhosAround() {
  const { data: members, isPending } = useMembersAround(true);
  if (!isPending && !members?.length) return null;

  return (
    <section
      aria-labelledby="around-title"
      className="flex flex-col gap-1.5 rounded-[18px] border border-line bg-surface px-5 pt-5 pb-3 shadow-card"
    >
      <h2 id="around-title" className="mb-1.5 font-display text-lg font-bold">
        Who&apos;s around
      </h2>
      {isPending ? (
        <div aria-hidden className="grid gap-1">
          {[0, 1, 2].map((index) => (
            <div key={index} className="flex items-center gap-3 py-2">
              <Skeleton className="size-[38px] rounded-full" />
              <div className="grid flex-1 gap-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ul>
          {members!.map(({ user, online, lastSeenAt }) => (
            <li key={user.id} className="flex items-center gap-3 py-2">
              <IntentLink href={`/u/${user.username}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg">
                <Avatar name={user.displayName} src={user.avatarUrl} size={38} online={online} />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-[14.5px] font-semibold">{user.displayName}</span>
                  <span
                    className={cn("font-mono text-[11px]", online ? "text-success" : "text-muted")}
                    suppressHydrationWarning
                  >
                    {online ? "Online" : lastSeenAt ? lastActive(lastSeenAt) : ""}
                  </span>
                </span>
              </IntentLink>
              <MessageButton username={user.username} compact />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
