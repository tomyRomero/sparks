"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * The messenger's two panes: the inbox and the open conversation. Wide
 * screens show both. Narrower ones show the inbox until a conversation is
 * opened, then the conversation alone, with a way back.
 */
export function Messenger({ inbox, children }: { inbox: React.ReactNode; children: React.ReactNode }) {
  const open = useSelectedLayoutSegment() !== null;
  return (
    <main id="main" className="flex h-dvh min-w-0 flex-1">
      <div
        className={cn(
          "min-w-0 flex-col border-line bg-surface lg:flex lg:w-[360px] lg:flex-none lg:border-r",
          open ? "hidden" : "flex flex-1",
        )}
      >
        {inbox}
      </div>
      <div className={cn("min-w-0 flex-1 lg:flex", open ? "flex" : "hidden")}>{children}</div>
    </main>
  );
}
