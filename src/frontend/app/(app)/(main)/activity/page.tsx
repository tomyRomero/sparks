import type { Metadata } from "next";
import { ActivityList } from "@/components/activity/activity-list";
import { MarkAllRead } from "@/components/activity/mark-all-read";
import { PageHeader } from "@/components/shell/page-header";
import { activityPath, readActivityFilter } from "@/lib/activity";
import { serverGet } from "@/lib/api/server";
import type { ActivityItem, OpaquePage } from "@/lib/api/types";
import { requireViewer } from "@/lib/auth/viewer";

export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage({ searchParams }: PageProps<"/activity">) {
  await requireViewer("/activity");
  const filter = readActivityFilter(await searchParams);
  const first = await serverGet<OpaquePage<ActivityItem>>(`/api/v1${activityPath(filter)}`);

  return (
    <>
      <PageHeader title="Activity">
        <MarkAllRead />
      </PageHeader>
      <ActivityList initialFilter={filter} initial={first} now={new Date().toISOString()} />
    </>
  );
}
