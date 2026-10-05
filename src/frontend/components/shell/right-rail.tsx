import { Zap } from "lucide-react";
import Link from "next/link";
import type { CurrentUser } from "@/lib/api/types";
import { Trending } from "./trending";
import { WhosAround } from "./whos-around";

export function RightRail({ viewer }: { viewer: CurrentUser | null }) {
  return (
    // At least a window tall, at the end of the row and stuck to the bottom:
    // it stays in view like a sticky column, and one taller than the window
    // scrolls with the page until its last card shows, with no scroll bar of its own.
    <aside className="sticky bottom-0 hidden min-h-dvh w-[320px] shrink-0 flex-col gap-4 self-end py-6 xl:flex 2xl:w-[360px]">
      {!viewer && (
        <section className="flex flex-col gap-3.5 rounded-[18px] border border-line bg-surface p-5 shadow-card">
          <h2 className="flex items-center gap-2.5 font-display text-lg font-bold">
            <span className="inline-flex size-[30px] items-center justify-center rounded-[9px] bg-charge-soft text-charge">
              <Zap className="size-4 fill-current" aria-hidden />
            </span>
            Draft with AI
          </h2>
          <p className="text-sm leading-normal text-ink-soft">
            Give it one line and a kind: a movie pitch, a book plot, a haiku or a painting, with a picture to match.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex h-[42px] items-center justify-center rounded-xl bg-charge px-4 text-[14.5px] font-semibold text-brand-ink transition-colors hover:bg-charge-bright"
          >
            Join to try it
          </Link>
        </section>
      )}
      <Trending />
      {viewer && <WhosAround />}
      <p className="mx-1.5 mt-auto label-mono">Sparks · a portfolio project by Tomy Romero</p>
    </aside>
  );
}
