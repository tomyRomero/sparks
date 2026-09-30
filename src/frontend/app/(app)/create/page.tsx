import type { Metadata } from "next";
import { Composer } from "@/components/compose/composer";
import { PageHeader } from "@/components/shell/page-header";
import { requireViewer } from "@/lib/auth/viewer";
import { isKind } from "@/lib/kinds";

export const metadata: Metadata = { title: "New spark" };

export default async function CreatePage({ searchParams }: PageProps<"/create">) {
  const { ai, kind: kindParam } = await searchParams;
  const withAi = ai === "1";
  const kind = isKind(kindParam) ? kindParam : undefined;

  // Guests come back to the same composer after signing in.
  const query = new URLSearchParams({ ...(withAi && { ai: "1" }), ...(kind && { kind }) });
  await requireViewer(query.size > 0 ? `/create?${query}` : "/create");

  return (
    <>
      <PageHeader title="New spark" back="/" />
      <Composer startWithAi={withAi} initialKind={kind} />
    </>
  );
}
