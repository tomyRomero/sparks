import { Skeleton } from "@/components/ui/skeleton";

export function ProfileHeaderSkeleton() {
  return (
    <>
      <div className="mb-4 overflow-hidden rounded-[18px] border border-line bg-surface pb-5 shadow-card">
        <div className="h-32 bg-raised sm:h-40" />
        <div className="px-5 sm:px-6">
          <Skeleton className="relative -mt-12 size-24 rounded-full ring-4 ring-surface" />
          <Skeleton className="mt-5 h-6 w-44" />
          <Skeleton className="mt-2.5 h-3 w-24" />
          <div className="mt-4 grid max-w-prose gap-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
          <Skeleton className="mt-4 h-3.5 w-36" />
          <Skeleton className="mt-5 h-[124px] w-full rounded-[14px] sm:h-[62px]" />
        </div>
      </div>
      <Skeleton className="mb-4 h-11 w-80 max-w-full rounded-xl" />
    </>
  );
}

export function PictureGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="aspect-square rounded-[14px]" />
      ))}
    </div>
  );
}

export function MemberListSkeleton({ count = 5 }: { count?: number }) {
  const names = ["w-32", "w-24", "w-40", "w-28", "w-36"];
  return (
    <div>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-6">
          <Skeleton className="size-11 shrink-0 rounded-full" />
          <div className="grid flex-1 gap-2">
            <Skeleton className={`h-4 ${names[index % names.length]}`} />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileFormSkeleton() {
  return (
    <div className="grid gap-8 rounded-[18px] border border-line bg-surface p-4 shadow-card sm:p-6">
      <div className="flex items-center gap-5">
        <Skeleton className="size-20 shrink-0 rounded-full" />
        <div className="grid gap-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <div className="grid gap-5">
        <div className="grid gap-2">
          <Skeleton className="h-3.5 w-12" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid gap-2">
          <Skeleton className="h-3.5 w-10" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    </div>
  );
}
