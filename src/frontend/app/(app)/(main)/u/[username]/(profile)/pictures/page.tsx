import { notFound } from "next/navigation";
import { PictureGrid } from "@/components/profile/picture-grid";
import { PageTop } from "@/components/ui/page-top";
import { serverGetOrNull } from "@/lib/api/server";
import type { CursorPage, Post } from "@/lib/api/types";
import { getViewer } from "@/lib/auth/viewer";
import { getProfile } from "@/lib/profiles";
import { queryKeys } from "@/lib/queries/keys";

export default async function ProfilePicturesPage({ params }: PageProps<"/u/[username]/pictures">) {
  const { username } = await params;
  const [viewer, profile] = await Promise.all([getViewer(), getProfile(username)]);
  if (!profile) notFound();
  const path = `/users/${profile.username}/posts?pictures=true`;
  const first = await serverGetOrNull<CursorPage<Post>>(`/api/v1${path}`);
  if (!first) notFound();

  return (
    <>
      <PageTop />
      <PictureGrid
        initial={first}
        path={path}
        queryKey={queryKeys.profilePosts(profile.username, "pictures")}
        empty={
          <p className="text-muted">
            {viewer?.id === profile.id ? "You haven't" : `${profile.displayName} hasn't`} shared a picture yet.
          </p>
        }
      />
    </>
  );
}
