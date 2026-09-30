import { FeedSkeleton } from "@/components/posts/post-skeletons";
import { PageHeader } from "@/components/shell/page-header";
import { PageSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <PageSkeleton label="Loading search">
      <PageHeader title="Search" />
      <div className="border-b border-line px-4 py-4 sm:px-6">
        <Skeleton className="h-11 w-full rounded-full" />
      </div>
      <FeedSkeleton count={3} />
    </PageSkeleton>
  );
}
