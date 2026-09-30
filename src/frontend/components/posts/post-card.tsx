import { MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import type { Post } from "@/lib/api/types";
import { fullDate, timeAgo } from "@/lib/time";
import { KindLabel } from "./kind-label";
import { LikeButton } from "./like-button";
import { PostBody } from "./post-body";

type PostCardProps = {
  post: Post;
  signedIn: boolean;
  /** Load the picture straight away: it's likely the largest thing on screen. */
  eagerImage?: boolean;
};

/** A spark in a list: who, when, what kind, the spark itself, and its counts. */
export function PostCard({ post, signedIn, eagerImage = false }: PostCardProps) {
  const href = `/p/${post.id}`;
  return (
    <article className="relative border-b border-line px-4 py-5 transition-colors hover:bg-surface/60 sm:px-6">
      <div className="flex gap-3">
        <Link href={`/u/${post.author.username}`} className="shrink-0" tabIndex={-1} aria-hidden>
          <Avatar name={post.author.displayName} src={post.author.avatarUrl} size={44} />
        </Link>
        <div className="min-w-0 flex-1">
          <header className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <Link href={`/u/${post.author.username}`} className="font-semibold hover:underline">
              {post.author.displayName}
            </Link>
            <span className="label-mono">@{post.author.username}</span>
            <Link href={href} className="label-mono hover:underline">
              <time dateTime={post.createdAt} title={fullDate(post.createdAt)} suppressHydrationWarning>
                {timeAgo(post.createdAt)}
              </time>
            </Link>
          </header>
          <div className="mt-1">
            <KindLabel kind={post.kind} aiPrompt={post.aiPrompt} />
          </div>
          <Link href={href} className="mt-3 block">
            <PostBody kind={post.kind} body={post.body} compact />
          </Link>
          {post.imageUrl && (
            // The text above is the link for keyboards and screen readers; this one is for pointers.
            <Link
              href={href}
              className="relative mt-4 block aspect-[4/3] overflow-hidden rounded-lg border border-line bg-raised"
              tabIndex={-1}
              aria-hidden
            >
              <Image
                src={post.imageUrl}
                alt=""
                fill
                loading={eagerImage ? "eager" : "lazy"}
                sizes="(min-width: 768px) 560px, 100vw"
                className="object-cover"
              />
            </Link>
          )}
          <footer className="-ml-2 mt-3 flex items-center gap-2">
            <LikeButton target={`/posts/${post.id}`} liked={post.likedByMe} count={post.likeCount} signedIn={signedIn} />
            <Link
              href={href}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-xs text-muted hover:bg-brand/10 hover:text-brand"
              aria-label={`${post.commentCount} ${post.commentCount === 1 ? "comment" : "comments"}`}
            >
              <MessageCircle className="size-4" aria-hidden />
              {post.commentCount}
            </Link>
          </footer>
        </div>
      </div>
    </article>
  );
}
