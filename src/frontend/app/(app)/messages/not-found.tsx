import Link from "next/link";
import { Button } from "@/components/ui/button";

/** A conversation that doesn't exist, or isn't the viewer's, shown in its pane. */
export default function ConversationNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
      <h2 className="font-display text-xl font-semibold tracking-tight">No such conversation</h2>
      <p className="max-w-sm text-muted">It doesn&apos;t exist, or it isn&apos;t yours.</p>
      <Button asChild variant="secondary">
        <Link href="/messages">Back to messages</Link>
      </Button>
    </div>
  );
}
