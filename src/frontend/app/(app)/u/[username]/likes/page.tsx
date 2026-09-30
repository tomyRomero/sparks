import { notFound } from "next/navigation";
import { Feed } from "@/components/posts/feed";
import { serverGetOrNull } from "@/lib/api/server";
import type { CursorPage, Post } from "@/lib/api/types";
import { getViewer } from "@/lib/auth/viewer";
import { getProfile } from "@/lib/profiles";
import { queryKeys } from "@/lib/queries/keys";

/** The sparks a member liked, newest sparks first. */
export default async function ProfileLikesPage({ params }: PageProps<"/u/[username]/likes">) {
  const { username } = await params;
  const [viewer, profile] = await Promise.all([getViewer(), getProfile(username)]);
  if (!profile) notFound();
  const path = `/users/${profile.username}/liked`;
  const first = await serverGetOrNull<CursorPage<Post>>(`/api/v1${path}`);
  if (!first) notFound();

  return (
    <Feed
      initial={first}
      path={path}
      queryKey={queryKeys.profilePosts(profile.username, "liked")}
      signedIn={viewer !== null}
      empty={<p className="text-muted">{viewer?.id === profile.id ? "You haven't" : `${profile.displayName} hasn't`} liked a spark yet.</p>}
    />
  );
}
