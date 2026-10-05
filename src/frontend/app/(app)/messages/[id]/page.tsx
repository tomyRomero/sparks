import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Chat } from "@/components/messages/chat";
import { serverGetOrNull } from "@/lib/api/server";
import type { Conversation, CursorPage, Message } from "@/lib/api/types";
import { requireViewer } from "@/lib/auth/viewer";
import { isId } from "@/lib/ids";

/** One fetch per request, shared by the page and its metadata. Outsiders get null, as for a missing one. */
const getConversation = cache((id: string) =>
  isId(id) ? serverGetOrNull<Conversation>(`/api/v1/conversations/${id}`) : null,
);

export async function generateMetadata({ params }: PageProps<"/messages/[id]">): Promise<Metadata> {
  const conversation = await getConversation((await params).id);
  return { title: conversation ? `Messages with ${conversation.with.displayName}` : "Messages" };
}

export default async function ConversationPage({ params }: PageProps<"/messages/[id]">) {
  const { id } = await params;
  const viewer = await requireViewer(`/messages/${id}`);
  const [conversation, first] = await Promise.all([
    getConversation(id),
    isId(id) ? serverGetOrNull<CursorPage<Message>>(`/api/v1/conversations/${id}/messages`) : null,
  ]);
  if (!conversation || !first) notFound();

  return <Chat conversation={conversation} initial={first} viewer={viewer} />;
}
