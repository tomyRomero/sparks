import Link from "next/link";
import { Marked } from "@/components/search/highlight";
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
            <Marked text={post.author.displayName} />
          </Link>
          <span className="truncate font-mono text-xs text-muted">
            @<Marked text={post.author.username} /> ·{" "}
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
        // The commenter's face and name go to their profile; anywhere else
        // opens the spark's comments.
        <div className="relative flex items-start gap-2.5 rounded-xl bg-raised px-3.5 py-3 transition-colors has-[a:hover]:bg-line/60">
          <Link
            href={`/u/${post.topComment.author.username}`}
            className="relative z-10 shrink-0 rounded-full"
            tabIndex={-1}
            aria-hidden
          >
            <Avatar name={post.topComment.author.displayName} src={post.topComment.author.avatarUrl} size={28} />
          </Link>
          <p className="line-clamp-2 min-w-0 text-sm leading-normal">
            <Link
              href={`/u/${post.topComment.author.username}`}
              className="relative z-10 font-semibold hover:underline"
            >
              {post.topComment.author.displayName}
            </Link>{" "}
            <Link
              href={`${href}#comments`}
              className="text-ink-soft after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-brand/50"
            >
              {post.topComment.body}
            </Link>
          </p>
        </div>
      )}

      {post.aiPrompt && <AiPrompt prompt={post.aiPrompt} />}

      <PostActions post={post} signedIn={signedIn} commentsHref={`${href}#comments`} />
    </article>
  );
}
