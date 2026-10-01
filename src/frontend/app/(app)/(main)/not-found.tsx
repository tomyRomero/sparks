import Link from "next/link";
import { Button } from "@/components/ui/button";

/** A spark, comment or member that doesn't exist, shown with the navigation still there. */
export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-24 text-center">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Nothing here</h1>
      <p className="max-w-sm text-muted">It doesn&apos;t exist, or it was deleted.</p>
      <Button asChild>
        <Link href="/">Back to the feed</Link>
      </Button>
    </div>
  );
}
