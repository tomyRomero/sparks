import { Zap } from "lucide-react";
import Link from "next/link";
import type { CurrentUser } from "@/lib/api/types";
import { kinds } from "@/lib/kinds";

/** Wide screens only: the way into AI drafting, and the feed by kind. */
export function RightRail({ viewer }: { viewer: CurrentUser | null }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-80 shrink-0 flex-col gap-6 overflow-y-auto px-6 py-8 xl:flex">
      <section className="rounded-lg border border-charge/30 bg-charge-soft p-5">
        <p className="flex items-center gap-2 label-mono text-charge">
          <Zap className="size-3.5 fill-current" aria-hidden /> Write with AI
        </p>
        <p className="mt-2 font-display text-lg leading-snug font-semibold">
          Turn a one-line idea into a movie pitch, a haiku or a picture.
        </p>
        <Link
          href={viewer ? "/create?ai=1" : "/sign-up"}
          className="mt-4 inline-flex h-9 items-center rounded-md bg-charge px-4 text-sm font-medium text-brand-ink hover:bg-charge-bright"
        >
          {viewer ? "Draft a spark" : "Join to try it"}
        </Link>
      </section>
      <section aria-labelledby="kinds-heading">
        <h2 id="kinds-heading" className="label-mono">
          Explore by kind
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {kinds.map(({ kind, label, icon: Icon }) => (
            <li key={kind}>
              <Link
                href={`/?kind=${kind}`}
                className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface px-2.5 py-1.5 text-sm text-ink-soft hover:border-line-strong hover:text-ink"
              >
                <Icon className="size-3.5" aria-hidden /> {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <p className="mt-auto label-mono">Sparks · a portfolio project</p>
    </aside>
  );
}
