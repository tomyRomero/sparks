"use client";

import { Button } from "@/components/ui/button";

export default function MessagesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
      <h2 className="font-display text-xl font-semibold tracking-tight">This conversation didn&apos;t load</h2>
      <p className="max-w-sm text-muted">Sparks may be restarting. Try again in a moment.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
