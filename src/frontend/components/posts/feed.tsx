"use client";

import { ListFooter } from "@/components/ui/list-footer";
import type { CursorPage, Post } from "@/lib/api/types";
import { usePagedList } from "@/lib/queries/use-paged-list";
import { PostCard } from "./post-card";

type FeedProps = {
  /** The first page, rendered on the server. */
  initial: CursorPage<Post>;
  /** The API path of the list, with any filters: "/posts?kind=haiku". */
  path: string;
  queryKey: readonly unknown[];
  signedIn: boolean;
  empty: React.ReactNode;
};

/** A list of sparks that keeps loading as the reader scrolls. */
export function Feed({ initial, path, queryKey, signedIn, empty }: FeedProps) {
  const { query, items: posts } = usePagedList(path, queryKey, initial);
  if (posts.length === 0) {
    return <div className="px-6 py-16 text-center">{empty}</div>;
  }

  const firstPicture = posts.find((post) => post.imageUrl)?.id;
  return (
    <div>
      <ul className="flex flex-col gap-4">
        {posts.map((post) => (
          <li key={post.id}>
            <PostCard post={post} signedIn={signedIn} eagerImage={post.id === firstPicture} />
          </li>
        ))}
      </ul>
      <ListFooter
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        failed={query.isFetchNextPageError}
        error={query.error}
        fetchNextPage={query.fetchNextPage}
        loadingLabel="Loading more sparks"
      />
    </div>
  );
}
