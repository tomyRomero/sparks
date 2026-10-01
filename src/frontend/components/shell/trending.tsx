"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Flame, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api/client";
import type { OpaquePage, Post } from "@/lib/api/types";
import { kindInfo } from "@/lib/kinds";
import { queryKeys } from "@/lib/queries/keys";
import { sparkPreview } from "@/lib/spark-text";
import { cn } from "@/lib/utils";

const SHOWN = 5;

/** The week's most liked sparks. Kept for a few minutes: it moves slowly. */
export function Trending() {
  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.trending,
    queryFn: () => api<OpaquePage<Post>>(`/posts/top?limit=${SHOWN}`),
    staleTime: 5 * 60_000,
  });
  if (isError || data?.items.length === 0) return null;

  return (
    <section
      aria-labelledby="trending-title"
      className="flex flex-col rounded-[18px] border border-line bg-surface px-5 pt-5 pb-2 shadow-card"
    >
      <h2 id="trending-title" className="mb-2 flex items-center gap-2 font-display text-lg font-bold">
        <Flame className="size-[18px] fill-like/15 text-like" aria-hidden />
        Trending this week
      </h2>
      {isPending ? (
        <TrendingSkeleton />
      ) : (
        <ol>
          {data.items.map((post, index) => (
            <li key={post.id}>
              <TrendingItem post={post} rank={index + 1} />
            </li>
          ))}
        </ol>
      )}
      <Link
        href="/?sort=top"
        className="group -mx-2 mt-1 flex items-center gap-1.5 rounded-lg px-2 py-2.5 text-sm font-medium text-brand hover:bg-brand-soft/60"
      >
        See the week&apos;s top sparks
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </section>
  );
}

function TrendingItem({ post, rank }: { post: Post; rank: number }) {
  const { label, icon: KindIcon } = kindInfo(post.kind);
  return (
    <Link
      href={`/p/${post.id}`}
      className="group -mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-raised"
    >
      <span
        className={cn(
          "w-4 shrink-0 text-center font-display text-lg font-bold tabular-nums",
          rank === 1 ? "text-brand" : "text-muted",
        )}
      >
        {rank}
      </span>
      {post.imageUrl ? (
        <Image
          src={post.imageUrl}
          alt=""
          width={44}
          height={44}
          className="size-11 shrink-0 rounded-[10px] bg-raised object-cover"
        />
      ) : (
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-raised text-muted">
          <KindIcon className="size-[18px]" aria-hidden />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-sm leading-snug font-medium group-hover:text-brand">
          {sparkPreview(post.kind, post.body, 90)}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
          <span className="truncate">
            {label} · {post.author.displayName}
          </span>
          <span className="ms-auto inline-flex shrink-0 items-center gap-1 font-mono tabular-nums">
            <Heart className="size-3 fill-like text-like" aria-hidden />
            <span className="sr-only">Likes:</span>
            {post.likeCount}
          </span>
        </span>
      </span>
    </Link>
  );
}

function TrendingSkeleton() {
  return (
    <div aria-hidden className="grid gap-1">
      {Array.from({ length: SHOWN }, (_, index) => (
        <div key={index} className="flex items-center gap-3 py-2">
          <Skeleton className="h-5 w-4" />
          <Skeleton className="size-11 rounded-[10px]" />
          <div className="grid flex-1 gap-1.5">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
