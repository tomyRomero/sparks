import { Skeleton } from "@/components/ui/skeleton";

/** Conversations on their way: the same frame as Inbox's rows. */
export function InboxSkeleton({ count = 5 }: { count?: number }) {
  const names = ["w-28", "w-36", "w-24", "w-32", "w-40"];
  return (
    <div>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex items-center gap-3 border-b border-line px-4 py-4 sm:px-6">
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
  );
}

/** A conversation on its way: a few bubbles on either side above the message box, as Chat lays them out. */
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
    <div className="flex h-[calc(100dvh-8.5rem)] flex-col md:h-[calc(100dvh-3.5rem)]">
      <div className="flex flex-1 flex-col justify-end gap-2 overflow-hidden px-4 py-4 sm:px-6">
        {bubbles.map((bubble, index) => (
          <Skeleton
            key={index}
            className={`h-10 max-w-[80%] rounded-2xl ${bubble.width} ${bubble.mine ? "self-end" : "self-start"}`}
          />
        ))}
      </div>
      <div className="flex items-end gap-2 border-t border-line px-4 py-3 sm:px-6">
        <Skeleton className="h-11 flex-1" />
        <Skeleton className="size-11 rounded-full" />
      </div>
    </div>
  );
}
