"use client";

import { ListFooter } from "@/components/ui/list-footer";
import type { CursorPage, Post } from "@/lib/api/types";
import { type ListPaging, usePagedList } from "@/lib/queries/use-paged-list";
import { cn } from "@/lib/utils";
import { PostCard } from "./post-card";

type FeedProps = {
  initial: CursorPage<Post>;
  /** The API path of the list, with any filters: "/posts?kind=haiku". */
  path: string;
  queryKey: readonly unknown[];
  signedIn: boolean;
  empty: React.ReactNode;
};

export function Feed({ initial, path, queryKey, signedIn, empty }: FeedProps) {
  const { query, items } = usePagedList(path, queryKey, initial);
  return <PostList posts={items} paging={query} signedIn={signedIn} empty={empty} />;
}

type PostListProps = {
  posts: Post[];
  paging: ListPaging;
  signedIn: boolean;
  empty: React.ReactNode;
  /** These are the last filter's results, shown faded while the new ones load. */
  stale?: boolean;
};

export function PostList({ posts, paging, signedIn, empty, stale = false }: PostListProps) {
  const fade = cn("transition-opacity duration-200", stale && "pointer-events-none opacity-50");
  if (posts.length === 0) {
    return <div className={cn("px-6 py-16 text-center", fade)}>{empty}</div>;
  }

  const firstPicture = posts.find((post) => post.imageUrl)?.id;
  return (
    <div aria-busy={stale} className={fade}>
      <ul className="flex flex-col gap-4">
        {posts.map((post) => (
          <li key={post.id}>
            <PostCard post={post} signedIn={signedIn} eagerImage={post.id === firstPicture} />
          </li>
        ))}
      </ul>
      {/* The old list's next page isn't the new list's. */}
      {!stale && (
        <ListFooter
          hasNextPage={paging.hasNextPage}
          isFetchingNextPage={paging.isFetchingNextPage}
          failed={paging.isFetchNextPageError}
          error={paging.error}
          fetchNextPage={paging.fetchNextPage}
          loadingLabel="Loading more sparks"
        />
      )}
    </div>
  );
}
