import { CommentListSkeleton } from "@/components/comments/comment-skeletons";
import { Panel } from "@/components/ui/panel";
import { PageSkeleton } from "@/components/ui/skeleton";

export default function ProfileCommentsLoading() {
  return (
    <PageSkeleton inPlace label="Loading comments">
      <Panel>
        <CommentListSkeleton count={4} />
      </Panel>
    </PageSkeleton>
  );
}
