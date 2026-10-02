import { PictureGridSkeleton } from "@/components/profile/profile-skeletons";
import { PageSkeleton } from "@/components/ui/skeleton";

export default function ProfilePicturesLoading() {
  return (
    <PageSkeleton inPlace label="Loading pictures">
      <PictureGridSkeleton />
    </PageSkeleton>
  );
}
