import { MobileNav } from "@/components/shell/mobile-nav";
import { getViewer } from "@/lib/auth/viewer";
import { LiveProvider } from "@/lib/realtime/live";

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

  // Keyed by member so a new sign-in gets a new connection.
  return viewer ? (
    <LiveProvider key={viewer.id} viewerId={viewer.id}>
      {page}
    </LiveProvider>
  ) : (
    page
  );
}
