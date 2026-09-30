import { CommentListSkeleton } from "@/components/comments/comment-skeletons";
import { PageHeader } from "@/components/shell/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";

export default function ThreadLoading() {
  return (
    <PageSkeleton label="Loading the thread">
      <PageHeader title="Thread" back="/" />
      <CommentListSkeleton count={4} />
    </PageSkeleton>
  );
}
