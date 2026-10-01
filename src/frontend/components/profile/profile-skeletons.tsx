import { Skeleton } from "@/components/ui/skeleton";

/** A profile's header and tabs on their way: the same frame as ProfileHeader and ProfileTabs. */
export function ProfileHeaderSkeleton() {
  return (
    <>
      <div className="mb-4 overflow-hidden rounded-[18px] border border-line bg-surface pb-5 shadow-card">
        <div className="h-24 bg-raised" />
        <div className="px-5 sm:px-6">
          <Skeleton className="-mt-11 size-[88px] rounded-full ring-4 ring-surface" />
          <Skeleton className="mt-5 h-6 w-44" />
          <Skeleton className="mt-2.5 h-3 w-24" />
          <div className="mt-4 grid max-w-prose gap-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
          <Skeleton className="mt-4 h-3.5 w-36" />
          <div className="mt-4 flex gap-5">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-28" />
          </div>
        </div>
      </div>
      <Skeleton className="mb-4 h-11 w-64 rounded-xl" />
    </>
  );
}

/** Members on their way: the same frame as MemberList. */
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

/** The profile settings form on its way: picture, then name and bio. */
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
