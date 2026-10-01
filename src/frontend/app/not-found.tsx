import Link from "next/link";
import { connection } from "next/server";
import { BoltMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  // Rendered per request, like every other page, so its scripts carry the
  // nonce the Content Security Policy asks for (see proxy.ts).
  await connection();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <BoltMark className="size-12" />
      <h1 className="font-display text-3xl font-semibold tracking-tight">Nothing here</h1>
      <p className="max-w-sm text-muted">This page doesn&apos;t exist, or what it showed was deleted.</p>
      <Button asChild>
        <Link href="/">Back to the feed</Link>
      </Button>
    </main>
  );
}
