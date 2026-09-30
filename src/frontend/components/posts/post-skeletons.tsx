import { Skeleton } from "@/components/ui/skeleton";

/** Text lines of different lengths, so a skeleton list doesn't look stamped out. */
const bodies = [
  ["w-full", "w-11/12", "w-2/3"],
  ["w-full", "w-3/5"],
  ["w-full", "w-full", "w-4/5"],
  ["w-5/6", "w-1/2"],
];

/** A spark in a list, before it arrives: the same frame as PostCard. */
export function PostCardSkeleton({ variant = 0, picture = false }: { variant?: number; picture?: boolean }) {
  const lines = bodies[variant % bodies.length];
  return (
    <div className="border-b border-line px-4 py-5 sm:px-6">
      <div className="flex gap-3">
        <Skeleton className="size-11 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 pt-0.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="mt-2.5 h-3 w-16" />
          <div className="mt-4 grid gap-2.5">
            {lines.map((width, index) => (
              <Skeleton key={index} className={`h-3.5 ${width}`} />
            ))}
          </div>
          {picture && <Skeleton className="mt-4 aspect-[4/3] w-full rounded-lg" />}
          <div className="mt-4 flex gap-4">
            <Skeleton className="h-5 w-10" />
            <Skeleton className="h-5 w-10" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** A list of sparks on its way: a few cards, one with a picture. */
export function FeedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }, (_, index) => (
        <PostCardSkeleton key={index} variant={index} picture={index === 1} />
      ))}
    </div>
  );
}

/** The feed's "share a spark" row. */
export function ComposerPromptSkeleton() {
  return (
    <div className="flex items-center gap-3 border-b border-line px-4 py-4 sm:px-6">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <Skeleton className="h-11 flex-1 rounded-full" />
      <Skeleton className="h-11 w-11 rounded-full sm:w-36" />
    </div>
  );
}

/** The row of kind chips. */
export function KindFilterSkeleton() {
  return (
    <div className="flex gap-2 overflow-hidden border-b border-line py-3 ps-4 sm:ps-6">
      {["w-11", "w-20", "w-28", "w-24", "w-20", "w-24", "w-28"].map((width, index) => (
        <Skeleton key={index} className={`h-8 shrink-0 rounded-full ${width}`} />
      ))}
    </div>
  );
}

/** One spark's own page: the same frame as PostDetail. */
export function PostDetailSkeleton() {
  return (
    <div className="border-b border-line px-4 py-5 sm:px-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 shrink-0 rounded-full" />
        <div className="grid flex-1 gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="mt-5 h-3 w-20" />
      <div className="mt-4 grid gap-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <Skeleton className="mt-4 h-3 w-40" />
      <div className="mt-4 flex gap-4 border-t border-line pt-3">
        <Skeleton className="h-5 w-10" />
        <Skeleton className="h-5 w-10" />
      </div>
    </div>
  );
}
