import { MessagesSquare } from "lucide-react";
import type { Metadata } from "next";
import { requireViewer } from "@/lib/auth/viewer";

export const metadata: Metadata = { title: "Messages" };

/** Wide screens only; narrow ones show the inbox here instead. */
export default async function MessagesPage() {
  await requireViewer("/messages");
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-canvas px-6 text-center">
      <span className="inline-flex size-16 items-center justify-center rounded-[20px] bg-brand-soft text-brand">
        <MessagesSquare className="size-8" aria-hidden />
      </span>
      <h2 className="font-display text-xl font-semibold tracking-tight">Your conversations</h2>
      <p className="max-w-xs text-muted">Pick one from the list, or start a new one with the pencil.</p>
    </div>
  );
}
