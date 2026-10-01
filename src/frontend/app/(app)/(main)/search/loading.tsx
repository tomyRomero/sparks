import { FeedSkeleton } from "@/components/posts/post-skeletons";
import { PageHeader } from "@/components/shell/page-header";
import { PageSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <PageSkeleton label="Loading search">
      <PageHeader title="Search" />
      <Skeleton className="mb-4 h-12 w-full rounded-[14px]" />
      <FeedSkeleton count={3} />
    </PageSkeleton>
  );
}
