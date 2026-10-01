"use client";

import { Button } from "@/components/ui/button";

export default function PageError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-24 text-center">
      <h1 className="font-display text-2xl font-semibold tracking-tight">This page didn&apos;t load</h1>
      <p className="max-w-sm text-muted">Sparks may be restarting. Try again in a moment.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
