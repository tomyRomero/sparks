"use client";

import { useState } from "react";
import { PostCard } from "@/components/posts/post-card";
import type { CurrentUser, Post, SparkKind } from "@/lib/api/types";
import type { DraftImage } from "@/lib/compose-draft";
import { kindInfo } from "@/lib/kinds";
import { cn } from "@/lib/utils";

type ComposerPreviewProps = {
  viewer: CurrentUser;
  kind: SparkKind;
  body: string;
  image: DraftImage | null;
  /** The idea the AI drafted from, shown on the card as on a real one. */
  aiPrompt: string | null;
};

/**
 * The feed card exactly as it will look, from what's written so far. Until
 * there's text, the kind's stand-in shows its layout. It's a picture of the
 * card, so nothing on it can be pressed or focused.
 */
export function ComposerPreview({ viewer, kind, body, image, aiPrompt }: ComposerPreviewProps) {
  const [createdAt] = useState(() => new Date().toISOString());
  const empty = body.trim() === "";
  const post: Post = {
    id: 0,
    kind,
    body: empty ? kindInfo(kind).sample : body,
    imageUrl: image?.url ?? null,
    aiPrompt,
    createdAt,
    editedAt: null,
    author: { id: viewer.id, username: viewer.username, displayName: viewer.displayName, avatarUrl: viewer.avatarUrl },
    likeCount: 0,
    commentCount: 0,
    likedByMe: false,
    topComment: null,
  };

  return (
    <div className="grid gap-3">
      <p className="flex items-center justify-between gap-3 px-1">
        <span className="label-mono">How it looks in the feed</span>
        {empty && <span className="label-mono text-muted">Example text until you write</span>}
      </p>
      <div inert className={cn("transition-opacity duration-300 select-none", empty && "opacity-60")}>
        <PostCard post={post} signedIn={false} eagerImage />
      </div>
    </div>
  );
}
