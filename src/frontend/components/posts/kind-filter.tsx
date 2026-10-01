"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { PendingIcon } from "@/components/ui/pending-icon";
import type { SparkKind } from "@/lib/api/types";
import { kinds } from "@/lib/kinds";
import { cn } from "@/lib/utils";

/** How far the row's edges fade out (1rem and 3rem in the mask below). */
const FADE_START_PX = 16;
const FADE_END_PX = 48;

/** The feed's kind chips: every kind, or one. */
export function KindFilter({ active }: { active: SparkKind | undefined }) {
  const list = useRef<HTMLUListElement>(null);

  // A kind picked from elsewhere (the right rail, a link) can sit past the
  // visible part of the row; bring it into view without scrolling the page.
  useEffect(() => {
    const row = list.current;
    const chip = row?.querySelector<HTMLElement>("[aria-current=page]");
    if (!row || !chip) return;
    const start = chip.offsetLeft;
    const end = start + chip.offsetWidth;
    if (start < row.scrollLeft + FADE_START_PX || end > row.scrollLeft + row.clientWidth - FADE_END_PX) {
      row.scrollLeft = start - (row.clientWidth - chip.offsetWidth) / 2;
    }
  }, [active]);

  const chip =
    "inline-flex h-[34px] items-center gap-1.5 whitespace-nowrap rounded-full border px-[13px] text-[13.5px] font-medium transition-colors";
  const idle = "border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink";
  const current = "border-ink bg-ink text-canvas";
  return (
    <nav aria-label="Filter by kind" className="-mx-3 mb-4 sm:-mx-4 md:mx-0">
      {/* One scrolling row; the faded edges say there are more kinds. */}
      <ul
        ref={list}
        className="relative flex [scrollbar-width:none] gap-2 overflow-x-auto [mask-image:linear-gradient(to_right,transparent,black_0.75rem,black_calc(100%-3rem),transparent)] py-0.5 ps-3 pe-12 sm:ps-4 md:ps-0.5"
      >
        <li className="shrink-0">
          <Link href="/" className={cn(chip, active ? idle : current)} aria-current={active ? undefined : "page"}>
            All
          </Link>
        </li>
        {kinds.map(({ kind, label, icon: Icon }) => (
          <li key={kind} className="shrink-0">
            <Link
              href={`/?kind=${kind}`}
              className={cn(chip, active === kind ? current : idle)}
              aria-current={active === kind ? "page" : undefined}
            >
              <PendingIcon icon={Icon} className="size-3.5" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
