import { Suspense } from "react";
import { ComposerPrompt } from "@/components/posts/composer-prompt";
import { HomeFeed } from "@/components/posts/home-feed";
import { FeedBarSkeleton, FeedSkeleton } from "@/components/posts/post-skeletons";
import { PageHeader } from "@/components/shell/page-header";
import { serverGet } from "@/lib/api/server";
import type { CursorPage, OpaquePage, Post } from "@/lib/api/types";
import { getViewer } from "@/lib/auth/viewer";
import { type FeedFilter, feedHref, feedPath, readFeedFilter } from "@/lib/feed";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const filter = readFeedFilter(await searchParams);
  const viewer = await getViewer();

  // Changes made on the page don't come back here; a link to another
  // filter does, and gets a fresh feed under its own key.
  return (
    <>
      <PageHeader title="Home" />
      {viewer && <ComposerPrompt viewer={viewer} />}
      <Suspense
        key={feedHref(filter)}
        fallback={
          <>
            <FeedBarSkeleton />
            <FeedSkeleton />
          </>
        }
      >
        <FirstPage filter={filter} signedIn={viewer !== null} />
      </Suspense>
    </>
  );
}

async function FirstPage({ filter, signedIn }: { filter: FeedFilter; signedIn: boolean }) {
  const first = await serverGet<CursorPage<Post> | OpaquePage<Post>>(`/api/v1${feedPath(filter)}`);
  return <HomeFeed initialFilter={filter} initial={first} signedIn={signedIn} />;
}
