import { ActivitySkeleton } from "@/components/activity/activity-skeleton";
import { PageHeader } from "@/components/shell/page-header";
import { Panel } from "@/components/ui/panel";
import { PageSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function ActivityLoading() {
  return (
    <PageSkeleton label="Loading activity">
      <PageHeader title="Activity" />
      <Skeleton className="mb-4 h-9 w-[19rem] max-w-full rounded-full" />
      <Panel>
        <ActivitySkeleton />
      </Panel>
    </PageSkeleton>
  );
}
