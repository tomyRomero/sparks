import { InboxSkeleton } from "@/components/messages/message-skeletons";
import { PageHeader } from "@/components/shell/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";

export default function MessagesLoading() {
  return (
    <PageSkeleton label="Loading messages">
      <PageHeader title="Messages" />
      <InboxSkeleton />
    </PageSkeleton>
  );
}
