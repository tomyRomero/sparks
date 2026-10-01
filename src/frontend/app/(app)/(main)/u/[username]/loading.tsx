import { FeedSkeleton } from "@/components/posts/post-skeletons";
import { PageSkeleton } from "@/components/ui/skeleton";

/** A profile tab's list on its way; the header and tabs above stay put. */
export default function ProfileSparksLoading() {
  return (
    <PageSkeleton label="Loading">
      <FeedSkeleton count={3} />
    </PageSkeleton>
  );
}
