import { Skeleton } from "@/components/ui/skeleton";

const lines = [["w-full", "w-2/3"], ["w-4/5"], ["w-full", "w-full", "w-1/2"]];

export function CommentListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="border-b border-line px-4 py-4 sm:px-6">
          <div className="flex gap-3">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 pt-0.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="mt-3 grid gap-2">
                {lines[index % lines.length].map((width, line) => (
                  <Skeleton key={line} className={`h-3.5 ${width}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CommentBoxSkeleton() {
  return (
    <div className="flex gap-3 border-b border-line px-4 py-4 sm:px-6">
      <Skeleton className="size-9 shrink-0 rounded-full" />
      <Skeleton className="h-20 flex-1" />
    </div>
  );
}
