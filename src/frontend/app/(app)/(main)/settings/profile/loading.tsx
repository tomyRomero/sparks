import { ProfileFormSkeleton } from "@/components/profile/profile-skeletons";
import { PageHeader } from "@/components/shell/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";

export default function EditProfileLoading() {
  return (
    <PageSkeleton label="Loading your profile">
      <PageHeader title="Settings" back="/" />
      <ProfileFormSkeleton />
    </PageSkeleton>
  );
}
