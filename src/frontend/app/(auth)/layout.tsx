import { Zap } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { getViewer } from "@/lib/auth/viewer";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getViewer()) {
    redirect("/");
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-[#04122b] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#0060d4_0,transparent_45%),radial-gradient(circle_at_80%_75%,#0891b2_0,transparent_40%)] opacity-70"
        />
        <Link href="/" className="relative">
          <span className="inline-flex items-center gap-2.5">
            <span className="inline-flex size-9 items-center justify-center rounded-md bg-white text-[#0060d4]">
              <Zap className="size-5 fill-current" aria-hidden />
            </span>
            <span className="font-wordmark text-2xl">Sparks</span>
          </span>
        </Link>
        <div className="relative max-w-md">
          <p className="font-display text-5xl leading-[1.05] font-semibold tracking-tight">
            Small ideas.
            <br />
            Bright sparks.
          </p>
          <p className="mt-5 text-lg text-white/75">
            Share a haiku, a movie pitch or a photo idea. Let AI help you draft it, then talk it over with people who
            care about the same things.
          </p>
        </div>
        <ul className="relative flex flex-wrap gap-2 font-mono text-xs text-white/80">
          {["haiku", "movie script", "book plot", "artwork", "fashion", "photography", "quote", "joke"].map((kind) => (
            <li key={kind} className="rounded-sm border border-white/20 px-2 py-1">
              {kind}
            </li>
          ))}
        </ul>
      </aside>
      <main className="flex flex-col items-center justify-center px-4 py-12 sm:px-8">
        <Link href="/" className="mb-10 lg:hidden">
          <Logo />
        </Link>
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
