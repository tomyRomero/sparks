/** Writing gets the width the feed's column and rail share, for the form and its preview side by side. */
export default function ComposeLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="mx-auto w-full max-w-[1180px] min-w-0 px-3 pb-24 sm:px-4 md:px-6 md:pb-12 lg:px-8">
      {children}
    </main>
  );
}
