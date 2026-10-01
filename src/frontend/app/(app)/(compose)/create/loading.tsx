import { ComposerSkeleton } from "@/components/compose/composer-skeleton";
import { PageHeader } from "@/components/shell/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";

export default function CreateLoading() {
  return (
    <PageSkeleton label="Loading the composer">
      <PageHeader title="New spark" back="/" />
      <ComposerSkeleton />
    </PageSkeleton>
  );
}
