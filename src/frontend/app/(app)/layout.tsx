import { MobileNav } from "@/components/shell/mobile-nav";
import { RightRail } from "@/components/shell/right-rail";
import { Sidebar } from "@/components/shell/sidebar";
import { getViewer } from "@/lib/auth/viewer";
import { LiveProvider } from "@/lib/realtime/live";

/** Every page after sign-in (and the public ones guests can read). */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  const page = (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-brand px-4 py-2 text-brand-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <div className="mx-auto flex min-h-dvh max-w-[1240px]">
        <Sidebar viewer={viewer} />
        <main id="main" className="min-w-0 flex-1 border-line pb-20 md:border-x md:pb-0">
          {children}
        </main>
        <RightRail viewer={viewer} />
      </div>
      <MobileNav viewer={viewer} />
    </>
  );

  // Members get a live connection, a new one for each member who signs in.
  return viewer ? (
    <LiveProvider key={viewer.id} viewerId={viewer.id}>
      {page}
    </LiveProvider>
  ) : (
    page
  );
}
