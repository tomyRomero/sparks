import Link from "next/link";
import type { CurrentUser } from "@/lib/api/types";
import { DraftWithAiTitle } from "./draft-with-ai-title";
import { QuickDraft } from "./quick-draft";
import { Trending } from "./trending";
import { WhosAround } from "./whos-around";

export function RightRail({ viewer }: { viewer: CurrentUser | null }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[320px] shrink-0 [scrollbar-width:thin] flex-col gap-4 overflow-y-auto py-6 xl:flex 2xl:w-[360px]">
      {viewer ? (
        <QuickDraft />
      ) : (
        <section className="flex flex-col gap-3.5 rounded-[18px] border border-line bg-surface p-5 shadow-card">
          <DraftWithAiTitle />
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
