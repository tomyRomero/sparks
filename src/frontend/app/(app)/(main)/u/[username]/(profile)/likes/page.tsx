import { Feed } from "@/components/posts/feed";
import { PageTop } from "@/components/ui/page-top";
import type { CursorPage, Post } from "@/lib/api/types";
import { getProfileList } from "@/lib/profiles";
import { queryKeys } from "@/lib/queries/keys";

export default async function ProfileLikesPage({ params }: PageProps<"/u/[username]/likes">) {
  const { viewer, profile, path, first, own } = await getProfileList<CursorPage<Post>>(
    (await params).username,
    "liked",
  );

  return (
    <>
      <PageTop />
      <Feed
        initial={first}
        path={path}
        queryKey={queryKeys.profilePosts(profile.username, "liked")}
        signedIn={viewer !== null}
        empty={<p className="text-muted">{own ? "You haven't" : `${profile.displayName} hasn't`} liked a spark yet.</p>}
      />
    </>
  );
}
