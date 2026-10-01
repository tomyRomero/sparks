import { notFound } from "next/navigation";
import { CommentFeed } from "@/components/comments/comment-feed";
import { Panel } from "@/components/ui/panel";
import { serverGetOrNull } from "@/lib/api/server";
import type { Comment, CursorPage } from "@/lib/api/types";
import { getViewer } from "@/lib/auth/viewer";
import { getProfile } from "@/lib/profiles";
import { queryKeys } from "@/lib/queries/keys";

export default async function ProfileCommentsPage({ params }: PageProps<"/u/[username]/comments">) {
  const { username } = await params;
  const [viewer, profile] = await Promise.all([getViewer(), getProfile(username)]);
  if (!profile) notFound();
  const path = `/users/${profile.username}/comments`;
  const first = await serverGetOrNull<CursorPage<Comment>>(`/api/v1${path}`);
  if (!first) notFound();

  return (
    <Panel>
      <CommentFeed
        initial={first}
        path={path}
        queryKey={queryKeys.profileComments(profile.username)}
        empty={
          <p className="text-muted">
            {viewer?.id === profile.id ? "You haven't" : `${profile.displayName} hasn't`} commented yet.
          </p>
        }
      />
    </Panel>
  );
}
