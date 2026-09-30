import Link from "next/link";
import { BoltMark } from "@/components/brand/logo";

/** The sticky title bar at the top of each page's column. */
export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex min-h-14 items-center gap-3 border-b border-line bg-canvas/85 px-4 backdrop-blur sm:px-6">
      {/* Phones have no sidebar, so the mark rides in the title bar. */}
      <Link href="/" className="md:hidden" aria-label="Sparks home">
        <BoltMark className="size-8" />
      </Link>
      <h1 className="flex-1 truncate font-display text-xl font-semibold tracking-tight">{title}</h1>
      {children}
    </header>
  );
}
