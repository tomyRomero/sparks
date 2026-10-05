import { RightRail } from "@/components/shell/right-rail";
import { getViewer } from "@/lib/auth/viewer";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  return (
    <div className="flex min-w-0 flex-1 justify-center gap-8 px-3 sm:px-4 md:px-6 lg:px-8 2xl:gap-12">
      <main id="main" className="w-full max-w-[680px] min-w-0 pb-24 md:pb-12 2xl:max-w-[720px]">
        {children}
      </main>
      <RightRail viewer={viewer} />
    </div>
  );
}
