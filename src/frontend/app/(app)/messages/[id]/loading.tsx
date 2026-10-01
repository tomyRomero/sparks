import { ChatSkeleton } from "@/components/messages/message-skeletons";
import { PageSkeleton } from "@/components/ui/skeleton";

export default function ConversationLoading() {
  return (
    <PageSkeleton label="Loading the conversation" className="flex flex-1">
      <ChatSkeleton />
    </PageSkeleton>
  );
}
