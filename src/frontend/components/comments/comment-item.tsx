"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, CornerDownRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { toast } from "sonner";
import { ItemMenu } from "@/components/posts/item-menu";
import { LikeButton } from "@/components/posts/like-button";
import { TextForm } from "@/components/posts/text-form";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/problem";
import type { Comment, CurrentUser } from "@/lib/api/types";
import { limits } from "@/lib/limits";
import { updateCachedComment, updateCachedPost } from "@/lib/queries/cache";
import { queryKeys } from "@/lib/queries/keys";
import { fullDate, timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import { CommentList } from "./comment-list";

/** Replies nest this deep on a page; deeper ones continue on the reply's own page. */
const MAX_DEPTH = 3;

type CommentItemProps = {
  comment: Comment;
  viewer: CurrentUser | null;
  depth: number;
  /** Runs after the member deletes this comment. */
  onDeleted: () => void;
  /** Open the replies straight away, for a comment shown on its own page. */
  startExpanded?: boolean;
};

/** One comment: who, when, what, its likes, and its replies behind a toggle. */
export function CommentItem({ comment, viewer, depth, onDeleted, startExpanded = false }: CommentItemProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const repliesId = useId();
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showReplies, setShowReplies] = useState(startExpanded);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const mine = viewer?.id === comment.author.id;
  const nestsHere = depth < MAX_DEPTH;

  async function reply(body: string) {
    await api<Comment>(`/comments/${comment.id}/replies`, { method: "POST", json: { body } });
    setReplying(false);
    updateCachedComment(queryClient, comment.id, (current) => ({ ...current, replyCount: current.replyCount + 1 }));
    updateCachedPost(queryClient, comment.postId, (post) => ({ ...post, commentCount: post.commentCount + 1 }));
    await queryClient.invalidateQueries({ queryKey: queryKeys.replies(comment.id) });
    if (nestsHere) {
      setShowReplies(true);
    } else {
      router.push(`/c/${comment.id}`);
    }
  }

  async function save(body: string) {
    const updated = await api<Comment>(`/comments/${comment.id}`, { method: "PATCH", json: { body } });
    updateCachedComment(queryClient, comment.id, () => updated);
    setEditing(false);
  }

  async function remove() {
    try {
      await api(`/comments/${comment.id}`, { method: "DELETE" });
    } catch (error) {
      toast.error(errorMessage(error));
      return;
    }
    if (comment.parentCommentId !== null) {
      updateCachedComment(queryClient, comment.parentCommentId, (parent) => ({
        ...parent,
        replyCount: Math.max(0, parent.replyCount - 1),
      }));
    }
    // The spark's count drops by the whole subtree, which only the server knows.
    await queryClient.invalidateQueries({ queryKey: queryKeys.posts });
    toast.success("Comment deleted");
    onDeleted();
  }

  const profile = `/u/${comment.author.username}`;
  return (
    <div className={cn(depth === 0 ? "border-b border-line px-4 py-4 sm:px-6" : "pt-4")}>
      <div className="flex gap-3">
        <Link href={profile} className="shrink-0" tabIndex={-1} aria-hidden>
          <Avatar name={comment.author.displayName} src={comment.author.avatarUrl} size={depth === 0 ? 36 : 30} />
        </Link>
        <div className="min-w-0 flex-1">
          <header className="flex items-start gap-2">
            <p className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
              <Link href={profile} className="text-sm font-semibold hover:underline">
                {comment.author.displayName}
              </Link>
              <span className="label-mono">@{comment.author.username}</span>
              <Link href={`/c/${comment.id}`} className="label-mono hover:underline">
                <time dateTime={comment.createdAt} title={fullDate(comment.createdAt)} suppressHydrationWarning>
                  {timeAgo(comment.createdAt)}
                </time>
              </Link>
              {comment.editedAt && <span className="label-mono">· edited</span>}
            </p>
            {mine && !editing && (
              <ItemMenu
                // Hangs into the margin so it doesn't push the text down.
                className="-my-1.5 -mr-1.5"
                label="Comment options"
                onEdit={() => setEditing(true)}
                onDelete={() => setConfirmingDelete(true)}
              />
            )}
          </header>

          {editing ? (
            <TextForm
              className="mt-2"
              label="Edit your comment"
              placeholder="Your comment"
              maxLength={limits.commentBodyMax}
              submitLabel="Save"
              initialValue={comment.body}
              focusOnOpen
              onSubmit={save}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <p className="mt-1 leading-relaxed whitespace-pre-line">{comment.body}</p>
          )}

          <div className="-ml-2 mt-1 flex items-center gap-1">
            <LikeButton
              target={{ kind: "comment", id: comment.id }}
              liked={comment.likedByMe}
              count={comment.likeCount}
              signedIn={viewer !== null}
              size="sm"
            />
            {viewer && (
              <button
                type="button"
                onClick={() => setReplying((open) => !open)}
                aria-expanded={replying}
                className="rounded-md px-2 py-1 font-mono text-[11px] text-muted transition-colors hover:bg-brand/10 hover:text-brand"
              >
                Reply
              </button>
            )}
          </div>

          {replying && (
            <TextForm
              className="mt-2"
              label={`Reply to ${comment.author.displayName}`}
              placeholder={`Reply to ${comment.author.displayName}…`}
              maxLength={limits.commentBodyMax}
              submitLabel="Reply"
              focusOnOpen
              onSubmit={reply}
              onCancel={() => setReplying(false)}
            />
          )}

          {comment.replyCount > 0 &&
            (nestsHere ? (
              <button
                type="button"
                onClick={() => setShowReplies((open) => !open)}
                aria-expanded={showReplies}
                aria-controls={showReplies ? repliesId : undefined}
                className="mt-1 -ml-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-brand hover:bg-brand/10"
              >
                <ChevronDown className={cn("size-4 transition-transform", !showReplies && "-rotate-90")} aria-hidden />
                {showReplies ? "Hide replies" : `${comment.replyCount} ${comment.replyCount === 1 ? "reply" : "replies"}`}
              </button>
            ) : (
              <Link
                href={`/c/${comment.id}`}
                className="mt-1 -ml-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-brand hover:bg-brand/10"
              >
                <CornerDownRight className="size-4" aria-hidden />
                Continue this thread
              </Link>
            ))}

          {showReplies && nestsHere && (
            <div id={repliesId} className="mt-1 border-l border-line pl-4">
              <CommentList
                path={`/comments/${comment.id}/replies`}
                queryKey={queryKeys.replies(comment.id)}
                viewer={viewer}
                depth={depth + 1}
              />
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title="Delete this comment?"
        description={
          comment.replyCount > 0
            ? "The replies beneath it are deleted too. This can't be undone."
            : "This can't be undone."
        }
        confirmLabel="Delete comment"
        onConfirm={remove}
      />
    </div>
  );
}
