"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

/** Goes back, or to `fallback` when there's no history (a shared link). */
export function BackButton({ fallback }: { fallback: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
      className="-ml-2 inline-flex size-9 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-raised hover:text-ink"
    >
      <ArrowLeft className="size-5" aria-hidden />
      <span className="sr-only">Back</span>
    </button>
  );
}
