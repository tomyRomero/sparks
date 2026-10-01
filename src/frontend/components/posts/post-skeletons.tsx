import { Skeleton } from "@/components/ui/skeleton";

/** Text lines of different lengths, so a skeleton list doesn't look stamped out. */
const bodies = [
  ["w-full", "w-11/12", "w-2/3"],
  ["w-full", "w-3/5"],
  ["w-full", "w-full", "w-4/5"],
  ["w-5/6", "w-1/2"],
];

/** A spark in a list, before it arrives: the same card as PostCard. */
export function PostCardSkeleton({ variant = 0, picture = false }: { variant?: number; picture?: boolean }) {
  const lines = bodies[variant % bodies.length];
  return (
    <div className="flex flex-col gap-3.5 rounded-[18px] border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 shrink-0 rounded-full" />
        <div className="flex flex-1 items-center gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-[26px] w-20 rounded-full" />
      </div>
      <div className="grid gap-2.5">
        {lines.map((width, index) => (
          <Skeleton key={index} className={`h-4 ${width}`} />
        ))}
      </div>
      {picture && <Skeleton className="aspect-[3/2] w-full rounded-[14px]" />}
      <div className="flex gap-4">
        <Skeleton className="h-5 w-10" />
        <Skeleton className="h-5 w-10" />
        <Skeleton className="h-5 w-14" />
      </div>
    </div>
  );
}

/** A list of sparks on its way: a few cards, one with a picture. */
export function FeedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: count }, (_, index) => (
        <PostCardSkeleton key={index} variant={index} picture={index === 1} />
      ))}
    </div>
  );
}

/** The feed's "what's your spark" card. */
export function ComposerPromptSkeleton() {
  return (
    <div className="mb-3 flex items-center gap-3 rounded-[18px] border border-line bg-surface p-2.5 shadow-card sm:px-4 sm:py-3.5">
      <Skeleton className="size-[34px] shrink-0 rounded-full sm:size-[42px]" />
      <Skeleton className="h-11 flex-1 rounded-xl sm:h-[46px]" />
      <Skeleton className="h-10 w-14 rounded-xl sm:h-[42px] sm:w-36" />
    </div>
  );
}

/** The row of kind chips. */
export function KindFilterSkeleton() {
  return (
    <div className="-mx-3 mb-4 flex gap-2 overflow-hidden ps-3 sm:-mx-4 sm:ps-4 md:mx-0 md:ps-0.5">
      {["w-11", "w-20", "w-28", "w-24", "w-20", "w-24", "w-28"].map((width, index) => (
        <Skeleton key={index} className={`h-[34px] shrink-0 rounded-full ${width}`} />
      ))}
    </div>
  );
}

/** One spark's own page: the same card as PostDetail. */
export function PostDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-[18px] border border-line bg-surface p-4 shadow-card sm:p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 shrink-0 rounded-full" />
        <div className="grid flex-1 gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-[26px] w-24 rounded-full" />
      </div>
      <div className="grid gap-3">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
      </div>
      <Skeleton className="h-3 w-40" />
      <div className="flex gap-4 border-t border-line pt-3">
        <Skeleton className="h-5 w-10" />
        <Skeleton className="h-5 w-10" />
        <Skeleton className="h-5 w-14" />
      </div>
    </div>
  );
}
