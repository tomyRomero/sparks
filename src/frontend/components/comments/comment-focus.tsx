"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowUpLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import type { Comment, CurrentUser } from "@/lib/api/types";
import { queryKeys } from "@/lib/queries/keys";
import { CommentItem } from "./comment-item";

export function CommentFocus({ initial, viewer }: { initial: Comment; viewer: CurrentUser | null }) {
  const router = useRouter();
  const { data: comment } = useQuery({
    queryKey: queryKeys.comment(initial.id),
    queryFn: () => api<Comment>(`/comments/${initial.id}`),
    initialData: initial,
  });
  const parent = comment.parentCommentId;
  return (
    <>
      <nav
        aria-label="Thread"
        className="flex flex-wrap gap-x-4 gap-y-1 border-b border-line px-4 py-3 text-sm sm:px-6"
      >
        <Link
          href={`/p/${comment.postId}`}
          className="inline-flex items-center gap-1 font-medium text-brand hover:underline"
        >
          <ArrowUpLeft className="size-4" aria-hidden />
          The spark
        </Link>
        {parent !== null && (
          <Link href={`/c/${parent}`} className="inline-flex items-center gap-1 font-medium text-brand hover:underline">
            <ArrowUpLeft className="size-4" aria-hidden />
            The comment it replies to
          </Link>
        )}
      </nav>
      <CommentItem
        comment={comment}
        viewer={viewer}
        depth={0}
        startExpanded
        onDeleted={() => router.replace(parent !== null ? `/c/${parent}` : `/p/${comment.postId}`)}
      />
    </>
  );
}
