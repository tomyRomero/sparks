import { FeedSkeleton } from "@/components/posts/post-skeletons";
import { ProfileHeaderSkeleton } from "@/components/profile/profile-skeletons";
import { PageHeader } from "@/components/shell/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";

/**
 * A profile on its way. It sits above [username] because that segment's
 * layout fetches the profile, and a loading file never covers its own
 * segment's layout.
 */
export default function ProfileLoading() {
  return (
    <PageSkeleton label="Loading the profile">
      <PageHeader title="Profile" back="/" />
      <ProfileHeaderSkeleton />
      <FeedSkeleton count={2} />
    </PageSkeleton>
  );
}
