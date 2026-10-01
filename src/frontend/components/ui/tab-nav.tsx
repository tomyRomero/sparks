import Link from "next/link";
import { cn } from "@/lib/utils";

export type Tab = { href: string; label: string; current: boolean };

/** Sections of one page as links, in a segmented control with the current one raised. */
export function TabNav({ label, tabs }: { label: string; tabs: Tab[] }) {
  return (
    <nav aria-label={label} className="mb-4">
      <ul className="inline-flex rounded-xl bg-raised p-1">
        {tabs.map((tab) => (
          <li key={tab.href}>
            <Link
              href={tab.href}
              aria-current={tab.current ? "page" : undefined}
              className={cn(
                "inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium text-ink-soft transition-colors hover:text-ink",
                tab.current && "bg-surface text-ink shadow-sm",
              )}
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
