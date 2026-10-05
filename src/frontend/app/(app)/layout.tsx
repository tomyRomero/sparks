import { cookies } from "next/headers";
import { MobileNav } from "@/components/shell/mobile-nav";
import { SearchShortcut } from "@/components/shell/search-shortcut";
import { Sidebar } from "@/components/shell/sidebar";
import { getViewer } from "@/lib/auth/viewer";
import { SIDEBAR_COOKIE } from "@/lib/preferences";
import { LiveProvider } from "@/lib/realtime/live";

/**
 * One frame for every page, so moving between sections never rebuilds the
 * navigation. Each group fills the space beside it: (main) with a column and
 * the right rail, messages with the inbox and a conversation.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [viewer, cookieStore] = await Promise.all([getViewer(), cookies()]);
  const page = (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-brand px-4 py-2 text-brand-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <div className="flex min-h-dvh">
        <Sidebar viewer={viewer} collapsed={cookieStore.get(SIDEBAR_COOKIE)?.value === "collapsed"} />
        <div className="flex min-w-0 flex-1">{children}</div>
      </div>
      <MobileNav viewer={viewer} />
      <SearchShortcut />
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
