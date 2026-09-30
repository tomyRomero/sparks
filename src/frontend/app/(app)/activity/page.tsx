import type { Metadata } from "next";
import { ActivityList } from "@/components/activity/activity-list";
import { PageHeader } from "@/components/shell/page-header";
import { serverGet } from "@/lib/api/server";
import type { ActivityItem, OpaquePage } from "@/lib/api/types";
import { requireViewer } from "@/lib/auth/viewer";

export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage() {
  await requireViewer("/activity");
  const first = await serverGet<OpaquePage<ActivityItem>>("/api/v1/activity");

  return (
    <>
      <PageHeader title="Activity" />
      <ActivityList initial={first} />
    </>
  );
}
