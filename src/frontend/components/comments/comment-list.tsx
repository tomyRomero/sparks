"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/problem";
import type { Comment, CurrentUser, CursorPage } from "@/lib/api/types";
import { CommentItem } from "./comment-item";

type CommentListProps = {
  /** The API path of the list: "/posts/12/comments" or "/comments/40/replies". */
  path: string;
  queryKey: readonly unknown[];
  initial?: CursorPage<Comment>;
  viewer: CurrentUser | null;
  /** How deeply this list is nested under the spark; replies past a limit move to their own page. */
  depth: number;
  empty?: React.ReactNode;
};

export function CommentList({ path, queryKey, initial, viewer, depth, empty }: CommentListProps) {
  const queryClient = useQueryClient();
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => api<CursorPage<Comment>>(pageParam ? `${path}?cursor=${pageParam}` : path),
    initialPageParam: null as number | null,
    getNextPageParam: (last) => last.nextCursor,
    ...(initial && { initialData: { pages: [initial], pageParams: [null] } }),
  });

  // Before the first page arrives. A later failure (the next page) keeps what's shown.
  if (!query.data) {
    return query.isError ? (
      <div className="flex items-center gap-3 py-3 text-sm text-muted">
        <p>{errorMessage(query.error)}</p>
        <Button variant="secondary" size="sm" onClick={() => void query.refetch()}>
          Try again
        </Button>
      </div>
    ) : (
      <div className="py-3">
        <Spinner label="Loading replies" />
      </div>
    );
  }

  const comments = query.data.pages.flatMap((page) => page.items);
  if (comments.length === 0) {
    return empty ?? null;
  }

  return (
    <div>
      <ul>
        {comments.map((comment) => (
          <li key={comment.id}>
            <CommentItem
              comment={comment}
              viewer={viewer}
              depth={depth}
              // A delete takes the replies beneath it too, so reload the list rather than guess.
              onDeleted={() => queryClient.invalidateQueries({ queryKey })}
            />
          </li>
        ))}
      </ul>
      {query.hasNextPage && (
        <div className="py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
          >
            {query.isFetchingNextPage ? "Loading…" : depth === 0 ? "Show more comments" : "Show more replies"}
          </Button>
          {query.isFetchNextPageError && <p className="text-sm text-danger">{errorMessage(query.error)}</p>}
        </div>
      )}
    </div>
  );
}
