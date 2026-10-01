import { sameDay } from "@/lib/time";

/** Messages from one sender this close together read as one run, with one timestamp. */
export const RUN_GAP_MS = 5 * 60_000;

type Sent = { senderId: number; createdAt: string };

/** Messages in a row from one sender, close in time. */
export type Run<T extends Sent> = { senderId: number; messages: T[] };

/** One day of a conversation, as runs. */
export type ChatDay<T extends Sent> = { day: string; runs: Run<T>[] };

/**
 * Groups a conversation, oldest first, into days and then runs. A run ends
 * when someone else speaks, when the gap passes five minutes, or at midnight.
 */
export function groupChat<T extends Sent>(messages: T[]): ChatDay<T>[] {
  const days: ChatDay<T>[] = [];
  for (const message of messages) {
    let day = days.at(-1);
    if (!day || !sameDay(day.day, message.createdAt)) {
      day = { day: message.createdAt, runs: [] };
      days.push(day);
    }

    const run = day.runs.at(-1);
    const previous = run?.messages.at(-1);
    if (
      run &&
      previous &&
      run.senderId === message.senderId &&
      new Date(message.createdAt).getTime() - new Date(previous.createdAt).getTime() < RUN_GAP_MS
    ) {
      run.messages.push(message);
    } else {
      day.runs.push({ senderId: message.senderId, messages: [message] });
    }
  }
  return days;
}
