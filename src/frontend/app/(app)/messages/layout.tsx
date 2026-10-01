import { Suspense } from "react";
import { Inbox } from "@/components/messages/inbox";
import { Messenger } from "@/components/messages/messenger";
import { InboxSkeleton } from "@/components/messages/message-skeletons";
import { serverGet } from "@/lib/api/server";
import type { Conversation, CurrentUser, OpaquePage } from "@/lib/api/types";
import { getViewer } from "@/lib/auth/viewer";

/** The inbox streams in and stays mounted while conversations change. */
export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  // The pages send guests to sign in, each with its own way back.
  const viewer = await getViewer();
  return viewer ? (
    <Messenger
      inbox={
        <Suspense fallback={<InboxSkeleton />}>
          <InboxPane viewer={viewer} />
        </Suspense>
      }
    >
      {children}
    </Messenger>
  ) : (
    <main id="main" className="flex-1">
      {children}
    </main>
  );
}

async function InboxPane({ viewer }: { viewer: CurrentUser }) {
  const first = await serverGet<OpaquePage<Conversation>>("/api/v1/conversations");
  return <Inbox initial={first} viewerId={viewer.id} />;
}
