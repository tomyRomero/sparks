import { PictureGrid } from "@/components/profile/picture-grid";
import { PageTop } from "@/components/ui/page-top";
import type { CursorPage, Post } from "@/lib/api/types";
import { getProfileList } from "@/lib/profiles";
import { queryKeys } from "@/lib/queries/keys";

export default async function ProfilePicturesPage({ params }: PageProps<"/u/[username]/pictures">) {
  const { profile, path, first, own } = await getProfileList<CursorPage<Post>>(
    (await params).username,
    "posts?pictures=true",
  );

  return (
    <>
      <PageTop />
      <PictureGrid
        initial={first}
        path={path}
        queryKey={queryKeys.profilePosts(profile.username, "pictures")}
        empty={
          <p className="text-muted">{own ? "You haven't" : `${profile.displayName} hasn't`} shared a picture yet.</p>
        }
      />
    </>
  );
}
