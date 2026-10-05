import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ActivitySkeleton({ count = 5 }: { count?: number }) {
  const widths = ["w-3/5", "w-1/2", "w-2/3", "w-2/5"];
  return (
    <div>
      <div className="border-b border-line px-4 py-2.5 sm:px-6">
        <Skeleton className="h-3 w-24" />
      </div>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex gap-3.5 border-b border-line px-4 py-4 sm:px-6">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="grid flex-1 gap-2.5">
            <div className="flex">
              {Array.from({ length: index % 3 === 0 ? 3 : 1 }, (_, face) => (
                <Skeleton key={face} className={cn("size-[30px] rounded-full", face > 0 && "-ml-2")} />
              ))}
            </div>
            <Skeleton className={`h-4 ${widths[index % widths.length]}`} />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
