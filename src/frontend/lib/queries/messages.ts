import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { CursorPage, Message, MessagesReadEvent } from "@/lib/api/types";
import { sparkPreview } from "@/lib/spark-text";
import { excerpt } from "@/lib/text";
import { queryKeys } from "./keys";

/** One-line preview for the inbox and toasts. */
export function messagePreview(message: Pick<Message, "body" | "sharedPost">, max: number): string {
  if (message.body) return excerpt(message.body, max);
  if (message.sharedPost) {
    return excerpt(`Shared a spark: ${sparkPreview(message.sharedPost.kind, message.sharedPost.body, max)}`, max);
  }
  return "Shared a spark that's since been deleted";
}

/** A conversation's messages as cached: pages newest first, each page newest first. */
type MessagePages = InfiniteData<CursorPage<Message>>;

/** Skips a message that's already cached; it can arrive from both the send and the hub. */
export function addCachedMessage(queryClient: QueryClient, message: Message) {
  queryClient.setQueryData<MessagePages>(queryKeys.messages(message.conversationId), (data) => {
    if (!data || data.pages.some((page) => page.items.some((item) => item.id === message.id))) return data;
    const [newest, ...older] = data.pages;
    return { ...data, pages: [{ ...newest, items: [message, ...newest.items] }, ...older] };
  });
}

/** Marks cached messages read: those sent to `readerId`, up to and including `upToMessageId`. */
export function markCachedMessagesRead(queryClient: QueryClient, read: MessagesReadEvent) {
  queryClient.setQueryData<MessagePages>(queryKeys.messages(read.conversationId), (data) =>
    data
      ? {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.map((message) =>
              message.id <= read.upToMessageId && message.senderId !== read.readerId && message.readAt === null
                ? { ...message, readAt: read.readAt }
                : message,
            ),
          })),
        }
      : data,
  );
}
