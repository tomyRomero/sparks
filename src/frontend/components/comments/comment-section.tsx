"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TextForm } from "@/components/posts/text-form";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import type { Comment, CurrentUser, CursorPage } from "@/lib/api/types";
import { limits } from "@/lib/limits";
import { updateCachedPost } from "@/lib/queries/cache";
import { queryKeys } from "@/lib/queries/keys";
import { CommentList } from "./comment-list";

type CommentSectionProps = {
  postId: number;
  /** The first page of comments, rendered on the server. */
  initial: CursorPage<Comment>;
  viewer: CurrentUser | null;
};

/** The conversation under a spark: a box to join it, then the comments. */
export function CommentSection({ postId, initial, viewer }: CommentSectionProps) {
  const pathname = usePathname();
  const queryClient = useQueryClient();

  async function comment(body: string) {
    await api<Comment>(`/posts/${postId}/comments`, { method: "POST", json: { body } });
    updateCachedPost(queryClient, postId, (post) => ({ ...post, commentCount: post.commentCount + 1 }));
    await queryClient.invalidateQueries({ queryKey: queryKeys.thread(postId) });
  }

  return (
    <section id="comments" aria-labelledby="comments-heading" className="scroll-mt-14">
      <h2 id="comments-heading" className="sr-only">
        Comments
      </h2>
      <div className="flex gap-3 border-b border-line px-4 py-4 sm:px-6">
        {viewer ? (
          <>
            <Avatar name={viewer.displayName} src={viewer.avatarUrl} size={36} />
            <TextForm
              className="flex-1"
              label="Write a comment"
              placeholder="Add to the conversation…"
              maxLength={limits.commentBodyMax}
              submitLabel="Comment"
              onSubmit={comment}
            />
          </>
        ) : (
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <p className="text-muted">Sign in to join the conversation.</p>
            <Button asChild size="sm">
              <Link href={`/sign-in?next=${encodeURIComponent(pathname)}`}>Sign in</Link>
            </Button>
          </div>
        )}
      </div>
      <CommentList
        path={`/posts/${postId}/comments`}
        queryKey={queryKeys.thread(postId)}
        initial={initial}
        viewer={viewer}
        depth={0}
        empty={
          <div className="px-6 py-12 text-center">
            <p className="font-display text-lg font-semibold">No comments yet</p>
            <p className="mt-1 text-muted">Say what it made you think of.</p>
          </div>
        }
      />
    </section>
  );
}
