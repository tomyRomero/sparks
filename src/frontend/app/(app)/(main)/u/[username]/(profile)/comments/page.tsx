import { CommentFeed } from "@/components/comments/comment-feed";
import { PageTop } from "@/components/ui/page-top";
import { Panel } from "@/components/ui/panel";
import type { Comment, CursorPage } from "@/lib/api/types";
import { getProfileList } from "@/lib/profiles";
import { queryKeys } from "@/lib/queries/keys";

export default async function ProfileCommentsPage({ params }: PageProps<"/u/[username]/comments">) {
  const { profile, path, first, own } = await getProfileList<CursorPage<Comment>>((await params).username, "comments");

  return (
    <>
      <PageTop />
      <Panel>
        <CommentFeed
          initial={first}
          path={path}
          queryKey={queryKeys.profileComments(profile.username)}
          empty={<p className="text-muted">{own ? "You haven't" : `${profile.displayName} hasn't`} commented yet.</p>}
        />
      </Panel>
    </>
  );
}
