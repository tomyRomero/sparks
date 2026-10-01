import { Skeleton } from "@/components/ui/skeleton";

export function ActivitySkeleton({ count = 6 }: { count?: number }) {
  const widths = ["w-3/5", "w-1/2", "w-2/3", "w-2/5"];
  return (
    <div>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex gap-3 border-b border-line px-4 py-4 sm:px-6">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="grid flex-1 gap-2.5 pt-0.5">
            <Skeleton className={`h-4 ${widths[index % widths.length]}`} />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
