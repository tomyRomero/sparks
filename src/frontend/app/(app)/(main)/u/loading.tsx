import { FeedSkeleton } from "@/components/posts/post-skeletons";
import { ProfileHeaderSkeleton } from "@/components/profile/profile-skeletons";
import { PageHeader } from "@/components/shell/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";

/**
 * Sits above [username] because a loading file can't cover its own
 * segment's layout, and that layout fetches the profile.
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
