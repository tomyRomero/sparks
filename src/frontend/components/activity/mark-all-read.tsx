"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CheckCheck, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/api/problem";
import { markAllActivityRead } from "@/lib/queries/activity";
import { useUnreadActivity } from "@/lib/queries/unread";
import { useHydrated } from "@/lib/use-hydrated";

/** Shown while anything is unread: activity that arrived live while the page was open. */
export function MarkAllRead() {
  const queryClient = useQueryClient();
  const { data: unread } = useUnreadActivity(true);
  const [marking, setMarking] = useState(false);
  // The count is fetched in the browser, and the shell around this page can
  // have it before this part hydrates; wait, so the first render matches
  // the server's.
  const hydrated = useHydrated();
  if (!hydrated || !unread) return null;

  async function markAll() {
    setMarking(true);
    try {
      await markAllActivityRead(queryClient);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setMarking(false);
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={() => void markAll()} disabled={marking} aria-busy={marking}>
      {marking ? <LoaderCircle className="animate-spin" aria-hidden /> : <CheckCheck aria-hidden />}
      Mark all read
    </Button>
  );
}
