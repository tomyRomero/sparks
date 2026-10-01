import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import type { Post } from "@/lib/api/types";
import { kindInfo } from "@/lib/kinds";
import { fullDate, timeAgo } from "@/lib/time";
import { AiChip, AiPrompt, KindChip } from "./kind-label";
import { PostActions } from "./post-actions";
import { SparkContent } from "./spark-content";

type PostCardProps = {
  post: Post;
  signedIn: boolean;
  /** Load the picture straight away: it's likely the largest thing on screen. */
  eagerImage?: boolean;
};

export function PostCard({ post, signedIn, eagerImage = false }: PostCardProps) {
  const href = `/p/${post.id}`;
  const profile = `/u/${post.author.username}`;
  return (
    <article
      aria-label={`${kindInfo(post.kind).label} by ${post.author.displayName}`}
      className="flex flex-col gap-3.5 rounded-[18px] border border-line bg-surface p-4 shadow-card sm:p-5"
    >
      <header className="flex items-center gap-3">
        <Link href={profile} className="shrink-0 rounded-full" tabIndex={-1} aria-hidden>
          <Avatar name={post.author.displayName} src={post.author.avatarUrl} size={44} />
        </Link>
        <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
          <Link href={profile} className="truncate text-[15.5px] font-semibold hover:underline">
            {post.author.displayName}
          </Link>
          <span className="truncate font-mono text-xs text-muted">
            @{post.author.username} ·{" "}
            <Link href={href} className="hover:underline">
              <time dateTime={post.createdAt} title={fullDate(post.createdAt)} suppressHydrationWarning>
                {timeAgo(post.createdAt)}
              </time>
            </Link>
          </span>
        </div>
        {post.aiPrompt && <AiChip />}
        <KindChip kind={post.kind} />
      </header>

      <SparkContent post={post} variant="card" eagerImage={eagerImage} />

      {post.topComment && (
        <Link
          href={`${href}#comments`}
          className="flex items-start gap-2.5 rounded-xl bg-raised px-3.5 py-3 transition-colors hover:bg-line/60"
        >
          <Avatar name={post.topComment.author.displayName} src={post.topComment.author.avatarUrl} size={28} />
          <span className="line-clamp-2 min-w-0 text-sm leading-normal">
            <span className="font-semibold">{post.topComment.author.displayName}</span>{" "}
            <span className="text-ink-soft">{post.topComment.body}</span>
          </span>
        </Link>
      )}

      {post.aiPrompt && <AiPrompt prompt={post.aiPrompt} />}

      <PostActions post={post} signedIn={signedIn} commentsHref={`${href}#comments`} />
    </article>
  );
}
