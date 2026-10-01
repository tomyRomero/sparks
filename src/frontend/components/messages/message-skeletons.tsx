import { Skeleton } from "@/components/ui/skeleton";

/** Conversations on their way: the inbox's header, filter and rows. */
export function InboxSkeleton({ count = 5 }: { count?: number }) {
  const names = ["w-28", "w-36", "w-24", "w-32", "w-40"];
  return (
    <div aria-busy="true" className="flex flex-1 flex-col">
      <p role="status" className="sr-only">
        Loading conversations
      </p>
      <div className="flex items-center justify-between px-5 pt-5 pb-3.5">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="size-10 rounded-xl" />
      </div>
      <div className="px-4 pb-3">
        <Skeleton className="h-[42px] rounded-xl" />
      </div>
      <div className="grid gap-0.5 px-2">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="flex items-center gap-3 px-3.5 py-3">
            <Skeleton className="size-12 shrink-0 rounded-full" />
            <div className="grid flex-1 gap-2.5">
              <div className="flex items-center gap-2">
                <Skeleton className={`h-4 ${names[index % names.length]}`} />
                <Skeleton className="ml-auto h-3 w-8" />
              </div>
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A conversation on its way: its header, a few bubbles on either side, and the message box. */
export function ChatSkeleton() {
  const bubbles: { mine: boolean; width: string }[] = [
    { mine: false, width: "w-48" },
    { mine: false, width: "w-64" },
    { mine: true, width: "w-40" },
    { mine: false, width: "w-56" },
    { mine: true, width: "w-72" },
    { mine: true, width: "w-32" },
  ];
  return (
    <div className="flex h-dvh flex-1 flex-col bg-canvas">
      <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3 sm:px-6">
        <Skeleton className="size-[42px] shrink-0 rounded-full" />
        <div className="grid flex-1 gap-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-end gap-2 overflow-hidden px-3 py-5 sm:px-8">
        {bubbles.map((bubble, index) => (
          <Skeleton
            key={index}
            className={`h-10 max-w-[80%] rounded-[20px] ${bubble.width} ${bubble.mine ? "self-end" : "self-start"}`}
          />
        ))}
      </div>
      <div className="flex items-end gap-2.5 border-t border-line bg-surface px-3 py-3 sm:px-6 sm:pb-4">
        <Skeleton className="size-11 shrink-0 rounded-full" />
        <Skeleton className="h-11 flex-1 rounded-[22px]" />
        <Skeleton className="size-11 shrink-0 rounded-full" />
      </div>
    </div>
  );
}
