import type { Metadata } from "next";
import { Composer } from "@/components/compose/composer";
import { PageHeader } from "@/components/shell/page-header";
import { requireViewer } from "@/lib/auth/viewer";
import { isKind } from "@/lib/kinds";
import { limits } from "@/lib/limits";

export const metadata: Metadata = { title: "New spark" };

export default async function CreatePage({ searchParams }: PageProps<"/create">) {
  const { ai, kind: kindParam, idea: ideaParam } = await searchParams;
  const withAi = ai === "1";
  const kind = isKind(kindParam) ? kindParam : undefined;
  const idea = typeof ideaParam === "string" ? ideaParam.slice(0, limits.aiPromptMax) : undefined;

  // Guests come back to the same composer after signing in.
  const query = new URLSearchParams({ ...(withAi && { ai: "1" }), ...(kind && { kind }), ...(idea && { idea }) });
  await requireViewer(query.size > 0 ? `/create?${query}` : "/create");

  return (
    <>
      <PageHeader title="New spark" back="/" />
      <Composer startWithAi={withAi} initialKind={kind} initialIdea={idea} />
    </>
  );
}
