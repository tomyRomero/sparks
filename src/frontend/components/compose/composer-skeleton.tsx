import { PostCardSkeleton } from "@/components/posts/post-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

/** The composer while it loads, and while the browser looks for a saved draft. */
export function ComposerSkeleton() {
  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start xl:gap-8 2xl:grid-cols-[minmax(0,1fr)_440px]">
      <Skeleton className="mb-4 h-9 w-48 rounded-full xl:hidden" />
      <div className="grid gap-7 rounded-[18px] border border-line bg-surface p-4 shadow-card sm:p-6">
        <Skeleton className="h-10 w-64 rounded-full" />
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {Array.from({ length: 10 }, (_, index) => (
            <Skeleton key={index} className="h-[88px] rounded-[14px]" />
          ))}
        </div>
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-28 w-full rounded-[14px]" />
        <Skeleton className="ml-auto h-12 w-36" />
      </div>
      <div className="hidden gap-3 xl:grid">
        <Skeleton className="h-3 w-40" />
        <PostCardSkeleton variant={2} />
      </div>
    </div>
  );
}
