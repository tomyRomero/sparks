import Link from "next/link";
import { cn } from "@/lib/utils";

export type Tab = { href: string; label: string; current: boolean; count?: number };

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export function TabNav({ label, tabs }: { label: string; tabs: Tab[] }) {
  return (
    <nav aria-label={label} className="mb-4 max-w-full overflow-x-auto">
      <ul className="inline-flex rounded-xl bg-raised p-1">
        {tabs.map((tab) => (
          <li key={tab.href}>
            <Link
              href={tab.href}
              // Switching tabs keeps your place on the page.
              scroll={false}
              aria-current={tab.current ? "page" : undefined}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium whitespace-nowrap text-ink-soft transition-colors hover:text-ink max-sm:px-3",
                tab.current && "bg-surface text-ink shadow-sm",
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "min-w-6 rounded-full px-1.5 py-px text-center font-mono text-[11px] tabular-nums",
                    tab.current ? "bg-brand-soft text-brand" : "bg-line/70 text-muted",
                  )}
                >
                  {compact.format(tab.count)}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
