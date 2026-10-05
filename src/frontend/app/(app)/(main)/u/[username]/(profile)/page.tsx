import { Feed } from "@/components/posts/feed";
import { PageTop } from "@/components/ui/page-top";
import type { CursorPage, Post } from "@/lib/api/types";
import { getProfileList } from "@/lib/profiles";
import { queryKeys } from "@/lib/queries/keys";

export default async function ProfileSparksPage({ params }: PageProps<"/u/[username]">) {
  const { viewer, profile, path, first, own } = await getProfileList<CursorPage<Post>>(
    (await params).username,
    "posts",
  );

  return (
    <>
      <PageTop />
      <Feed
        initial={first}
        path={path}
        queryKey={queryKeys.profilePosts(profile.username, "posts")}
        signedIn={viewer !== null}
        empty={
          <p className="text-muted">{own ? "You haven't" : `${profile.displayName} hasn't`} shared a spark yet.</p>
        }
      />
    </>
  );
}
