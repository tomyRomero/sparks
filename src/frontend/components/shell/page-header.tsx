import Link from "next/link";
import { BoltMark } from "@/components/brand/logo";
import { BackButton } from "./back-button";

type PageHeaderProps = {
  title: string;
  /** Show a back button, going here when there's no history to go back to. */
  back?: string;
  children?: React.ReactNode;
};

export function PageHeader({ title, back, children }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-20 -mx-3 mb-3 flex min-h-14 items-center gap-3 bg-canvas/85 px-3 backdrop-blur-md sm:-mx-4 sm:px-4 md:mx-0 md:min-h-[72px] md:px-1 md:pt-2">
      {back ? (
        <BackButton fallback={back} />
      ) : (
        // Phones have no sidebar, so the mark rides in the title bar.
        <Link href="/" className="rounded-md md:hidden" aria-label="Sparks home">
          <BoltMark className="size-8 rounded-[9px]" />
        </Link>
      )}
      <h1 className="flex-1 truncate font-display text-xl font-bold tracking-tight md:text-[28px]">{title}</h1>
      {children}
    </header>
  );
}
