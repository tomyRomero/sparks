"use client";

import { MessageCircle, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Post } from "@/lib/api/types";
import { LikeButton } from "./like-button";
import { ShareDialog } from "./share-dialog";

/** The look every action under a spark shares: quiet mono counts that light up on hover. */
export const actionStyle =
  "inline-flex h-[34px] items-center gap-[7px] rounded-[9px] px-2.5 font-mono text-[12.5px] text-muted transition-colors";

type PostActionsProps = {
  post: Post;
  signedIn: boolean;
  /** Where the comment count goes: the spark's page from a list, its thread on the page itself. */
  commentsHref: string;
};

/** Like, comments and share, under a spark. */
export function PostActions({ post, signedIn, commentsHref }: PostActionsProps) {
  const [sharing, setSharing] = useState(false);
  return (
    <div className="-ml-2.5 flex items-center gap-1">
      <LikeButton
        target={{ kind: "post", id: post.id }}
        liked={post.likedByMe}
        count={post.likeCount}
        signedIn={signedIn}
      />
      <Link href={commentsHref} className={`${actionStyle} hover:bg-brand/10 hover:text-brand`}>
        <MessageCircle className="size-[18px]" aria-hidden />
        {post.commentCount}
        <span className="sr-only">{post.commentCount === 1 ? " comment" : " comments"}</span>
      </Link>
      <button
        type="button"
        onClick={() => setSharing(true)}
        className={`${actionStyle} hover:bg-raised hover:text-ink`}
      >
        <Send className="size-[18px]" aria-hidden />
        Share
      </button>
      {sharing && <ShareDialog post={post} open={sharing} onOpenChange={setSharing} signedIn={signedIn} />}
    </div>
  );
}
