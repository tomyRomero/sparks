"use client";

import { CornerDownRight, Heart, MessageCircle } from "lucide-react";
import { IntentLink } from "@/components/ui/intent-link";
import { ListFooter } from "@/components/ui/list-footer";
import type { Comment, CursorPage } from "@/lib/api/types";
import { usePagedList } from "@/lib/queries/use-paged-list";
import { fullDate, timeAgo } from "@/lib/time";

type CommentFeedProps = {
  initial: CursorPage<Comment>;
  path: string;
  queryKey: readonly unknown[];
  empty: React.ReactNode;
};

export function CommentFeed({ initial, path, queryKey, empty }: CommentFeedProps) {
  const { query, items: comments } = usePagedList(path, queryKey, initial);
  if (comments.length === 0) {
    return <div className="px-6 py-16 text-center">{empty}</div>;
  }

  return (
    <div>
      <ul>
        {comments.map((comment) => (
          <li key={comment.id} className="border-b border-line px-4 py-4 transition-colors hover:bg-surface/60 sm:px-6">
            <p className="flex items-center gap-1.5 label-mono">
              <CornerDownRight className="size-3.5" aria-hidden />
              {comment.parentCommentId === null ? "Commented on a spark" : "Replied in a thread"}
              <span aria-hidden>·</span>
              <time dateTime={comment.createdAt} title={fullDate(comment.createdAt)} suppressHydrationWarning>
                {timeAgo(comment.createdAt)}
              </time>
            </p>
            <IntentLink
              href={`/c/${comment.id}`}
              className="mt-1.5 block leading-relaxed whitespace-pre-line hover:underline"
            >
              {comment.body}
            </IntentLink>
            <p className="mt-2 flex gap-4 font-mono text-xs text-muted">
              <span className="inline-flex items-center gap-1">
                <Heart className="size-3.5" aria-hidden />
                {comment.likeCount}
                <span className="sr-only">{comment.likeCount === 1 ? " like" : " likes"}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="size-3.5" aria-hidden />
                {comment.replyCount}
                <span className="sr-only">{comment.replyCount === 1 ? " reply" : " replies"}</span>
              </span>
              <IntentLink href={`/p/${comment.postId}`} className="ml-auto text-brand hover:underline">
                View the spark
              </IntentLink>
            </p>
          </li>
        ))}
      </ul>
      <ListFooter
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        failed={query.isFetchNextPageError}
        error={query.error}
        fetchNextPage={query.fetchNextPage}
        loadingLabel="Loading more comments"
      />
    </div>
  );
}
