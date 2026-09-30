import { ActivitySkeleton } from "@/components/activity/activity-skeleton";
import { PageHeader } from "@/components/shell/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";

export default function ActivityLoading() {
  return (
    <PageSkeleton label="Loading activity">
      <PageHeader title="Activity" />
      <ActivitySkeleton />
    </PageSkeleton>
  );
}
