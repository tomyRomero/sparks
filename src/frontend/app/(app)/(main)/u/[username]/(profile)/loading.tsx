import { FeedSkeleton } from "@/components/posts/post-skeletons";
import { PageSkeleton } from "@/components/ui/skeleton";

export default function ProfileSparksLoading() {
  return (
    <PageSkeleton inPlace label="Loading sparks">
      <FeedSkeleton count={3} />
    </PageSkeleton>
  );
}
