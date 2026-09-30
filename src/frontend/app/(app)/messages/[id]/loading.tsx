import { ChatSkeleton } from "@/components/messages/message-skeletons";
import { PageHeader } from "@/components/shell/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";

export default function ConversationLoading() {
  return (
    <PageSkeleton label="Loading the conversation">
      <PageHeader title="Messages" back="/messages" />
      <ChatSkeleton />
    </PageSkeleton>
  );
}
