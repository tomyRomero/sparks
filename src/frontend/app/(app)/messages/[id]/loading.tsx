import { ChatSkeleton } from "@/components/messages/message-skeletons";
import { PageSkeleton } from "@/components/ui/skeleton";

export default function ConversationLoading() {
  return (
    <PageSkeleton inPlace label="Loading the conversation" className="flex flex-1">
      <ChatSkeleton />
    </PageSkeleton>
  );
}
