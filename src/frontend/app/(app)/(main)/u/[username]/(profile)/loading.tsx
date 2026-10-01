import { FeedSkeleton } from "@/components/posts/post-skeletons";
import { PageSkeleton } from "@/components/ui/skeleton";

export default function ProfileSparksLoading() {
  return (
    <PageSkeleton label="Loading">
      <FeedSkeleton count={3} />
    </PageSkeleton>
  );
}
