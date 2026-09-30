import { CommentBoxSkeleton, CommentListSkeleton } from "@/components/comments/comment-skeletons";
import { PostDetailSkeleton } from "@/components/posts/post-skeletons";
import { PageHeader } from "@/components/shell/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";

export default function PostLoading() {
  return (
    <PageSkeleton label="Loading the spark">
      <PageHeader title="Spark" back="/" />
      <PostDetailSkeleton />
      <CommentBoxSkeleton />
      <CommentListSkeleton />
    </PageSkeleton>
  );
}
