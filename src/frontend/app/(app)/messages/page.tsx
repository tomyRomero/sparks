import type { Metadata } from "next";
import { Inbox } from "@/components/messages/inbox";
import { PageHeader } from "@/components/shell/page-header";
import { serverGet } from "@/lib/api/server";
import type { Conversation, OpaquePage } from "@/lib/api/types";
import { requireViewer } from "@/lib/auth/viewer";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const viewer = await requireViewer("/messages");
  const first = await serverGet<OpaquePage<Conversation>>("/api/v1/conversations");

  return (
    <>
      <PageHeader title="Messages" />
      <Inbox initial={first} viewerId={viewer.id} />
    </>
  );
}
