import { ComposerPromptSkeleton, FeedBarSkeleton, FeedSkeleton } from "@/components/posts/post-skeletons";
import { PageHeader } from "@/components/shell/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <PageSkeleton label="Loading the feed">
      <PageHeader title="Home" />
      <ComposerPromptSkeleton />
      <FeedBarSkeleton />
      <FeedSkeleton />
    </PageSkeleton>
  );
}
