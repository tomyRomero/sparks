import { Zap } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import type { CurrentUser } from "@/lib/api/types";

/** The top of the feed: a way in to writing, by hand or with AI. */
export function ComposerPrompt({ viewer }: { viewer: CurrentUser }) {
  return (
    <div className="flex items-center gap-3 border-b border-line px-4 py-4 sm:px-6">
      <Avatar name={viewer.displayName} src={viewer.avatarUrl} size={40} />
      <Link
        href="/create"
        className="flex h-11 flex-1 items-center rounded-full border border-line bg-surface px-4 text-muted transition-colors hover:border-line-strong"
      >
        Share a spark…
      </Link>
      <Link
        href="/create?ai=1"
        className="inline-flex h-11 items-center gap-1.5 rounded-full bg-charge-soft px-4 text-sm font-medium text-charge transition-colors hover:bg-charge hover:text-brand-ink"
      >
        <Zap className="size-4 fill-current" aria-hidden />
        <span className="max-sm:sr-only">Draft with AI</span>
      </Link>
    </div>
  );
}
