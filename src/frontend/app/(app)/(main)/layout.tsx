import { RightRail } from "@/components/shell/right-rail";
import { Sidebar } from "@/components/shell/sidebar";
import { getViewer } from "@/lib/auth/viewer";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  return (
    <div className="mx-auto flex min-h-dvh max-w-[1320px] justify-center md:gap-6 md:px-4 xl:gap-10">
      <Sidebar viewer={viewer} />
      <main id="main" className="min-w-0 flex-1 px-3 pb-24 sm:px-4 md:max-w-[640px] md:px-0 md:pb-12">
        {children}
      </main>
      <RightRail viewer={viewer} />
    </div>
  );
}
