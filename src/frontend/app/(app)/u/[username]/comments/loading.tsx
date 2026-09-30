import { CommentListSkeleton } from "@/components/comments/comment-skeletons";
import { PageSkeleton } from "@/components/ui/skeleton";

export default function ProfileCommentsLoading() {
  return (
    <PageSkeleton label="Loading comments">
      <CommentListSkeleton count={4} />
    </PageSkeleton>
  );
}
