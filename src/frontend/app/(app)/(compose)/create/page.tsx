import type { Metadata } from "next";
import { Composer } from "@/components/compose/composer";
import { PageHeader } from "@/components/shell/page-header";
import { requireViewer } from "@/lib/auth/viewer";

export const metadata: Metadata = { title: "New spark" };

export default async function CreatePage() {
  const viewer = await requireViewer("/create");

  return (
    <>
      <PageHeader title="New spark" back="/" />
      <Composer viewer={viewer} />
    </>
  );
}
