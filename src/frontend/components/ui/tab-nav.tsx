import Link from "next/link";
import { cn } from "@/lib/utils";

export type Tab = { href: string; label: string; current: boolean };

/** Sections of one page as links, the current one underlined. */
export function TabNav({ label, tabs }: { label: string; tabs: Tab[] }) {
  return (
    <nav aria-label={label} className="border-b border-line">
      <ul className="flex px-2 sm:px-4">
        {tabs.map((tab) => (
          <li key={tab.href}>
            <Link
              href={tab.href}
              aria-current={tab.current ? "page" : undefined}
              className={cn(
                "relative inline-flex h-12 items-center px-4 text-sm font-medium text-muted transition-colors hover:text-ink",
                tab.current &&
                  "text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-brand",
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
