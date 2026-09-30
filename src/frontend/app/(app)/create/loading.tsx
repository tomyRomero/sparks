import { PageHeader } from "@/components/shell/page-header";
import { PageSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function CreateLoading() {
  return (
    <PageSkeleton label="Loading the composer">
      <PageHeader title="New spark" back="/" />
      <div className="grid gap-6 px-4 py-6 sm:px-6">
        <Skeleton className="h-10 w-64 rounded-full" />
        <div className="flex flex-wrap gap-2">
          {["w-20", "w-28", "w-24", "w-20", "w-24", "w-28", "w-20"].map((width, index) => (
            <Skeleton key={index} className={`h-9 rounded-full ${width}`} />
          ))}
        </div>
        <Skeleton className="h-44 w-full" />
        <Skeleton className="ml-auto h-12 w-36" />
      </div>
    </PageSkeleton>
  );
}
