import { Zap } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import type { CurrentUser } from "@/lib/api/types";

export function ComposerPrompt({ viewer }: { viewer: CurrentUser }) {
  const firstName = viewer.displayName.split(/\s+/)[0];
  return (
    <div className="mb-3 flex items-center gap-3 rounded-[18px] border border-line bg-surface p-2.5 shadow-card sm:px-4 sm:py-3.5">
      <Avatar name={viewer.displayName} src={viewer.avatarUrl} size={40} />
      <Link
        href="/create"
        className="flex h-11 min-w-0 flex-1 items-center truncate rounded-xl border-line px-1 text-[15px] text-muted transition-colors hover:border-line-strong sm:h-[46px] sm:border sm:bg-canvas sm:px-4"
      >
        What&apos;s your spark, {firstName}?
      </Link>
      <Link
        href="/create?ai=1"
        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-charge-soft px-3 text-sm font-semibold text-charge transition-colors hover:bg-charge hover:text-brand-ink sm:h-[42px] sm:px-4 sm:text-[14.5px]"
      >
        <Zap className="size-4 fill-current" aria-hidden />
        <span className="max-sm:sr-only">Draft with AI</span>
        <span className="sm:hidden" aria-hidden>
          AI
        </span>
      </Link>
    </div>
  );
}
