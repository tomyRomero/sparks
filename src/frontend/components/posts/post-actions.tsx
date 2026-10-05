"use client";

import { MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { IntentLink } from "@/components/ui/intent-link";
import type { Post } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { LikeButton, type LikeControl, LikeToggle } from "./like-button";
import { ShareDialog } from "./share-dialog";

const actionStyle =
  "inline-flex h-[34px] items-center gap-[7px] rounded-[9px] px-2.5 font-mono text-[12.5px] text-muted transition-colors";

type PostActionsProps = {
  post: Post;
  signedIn: boolean;
  /** Where the comment count goes: the spark's page from a list, its thread on the page itself. */
  commentsHref: string;
  /** The like state, when something else on the page can like too (a double tap on the picture). */
  like?: LikeControl;
};

export function PostActions({ post, signedIn, commentsHref, like }: PostActionsProps) {
  const [sharing, setSharing] = useState(false);
  return (
    <div className="-ml-2.5 flex items-center gap-1">
      {like ? (
        <LikeToggle like={like} />
      ) : (
        <LikeButton
          target={{ kind: "post", id: post.id }}
          liked={post.likedByMe}
          count={post.likeCount}
          signedIn={signedIn}
        />
      )}
      <IntentLink href={commentsHref} className={cn(actionStyle, "hover:bg-brand/10 hover:text-brand")}>
        <MessageCircle className="size-[18px]" aria-hidden />
        {post.commentCount}
        <span className="sr-only">{post.commentCount === 1 ? " comment" : " comments"}</span>
      </IntentLink>
      <button
        type="button"
        onClick={() => setSharing(true)}
        className={cn(actionStyle, "hover:bg-raised hover:text-ink")}
      >
        <Send className="size-[18px]" aria-hidden />
        Share
      </button>
      {sharing && <ShareDialog post={post} open={sharing} onOpenChange={setSharing} signedIn={signedIn} />}
    </div>
  );
}
