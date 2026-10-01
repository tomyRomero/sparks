import { MobileNav } from "@/components/shell/mobile-nav";
import { getViewer } from "@/lib/auth/viewer";
import { LiveProvider } from "@/lib/realtime/live";

/**
 * Every page after sign-in (and the public ones guests can read). The
 * frame around each page comes from its group: (main) for most, the
 * messenger's own for messages.
 */
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
      {children}
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
