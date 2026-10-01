"use client";

import { Heart, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ListFooter } from "@/components/ui/list-footer";
import type { CursorPage, Post } from "@/lib/api/types";
import { kindInfo } from "@/lib/kinds";
import { usePagedList } from "@/lib/queries/use-paged-list";
import { sparkPreview } from "@/lib/spark-text";

type PictureGridProps = {
  initial: CursorPage<Post>;
  path: string;
  queryKey: readonly unknown[];
  empty: React.ReactNode;
};

/** A member's sparks with pictures as square tiles, newest first; each opens its spark. */
export function PictureGrid({ initial, path, queryKey, empty }: PictureGridProps) {
  const { query, items } = usePagedList(path, queryKey, initial);
  const posts = items.filter((post) => post.imageUrl);
  if (posts.length === 0) {
    return <div className="px-6 py-16 text-center">{empty}</div>;
  }

  return (
    <div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {posts.map((post, index) => {
          const { label, icon: KindIcon } = kindInfo(post.kind);
          return (
            <li key={post.id}>
              <Link
                href={`/p/${post.id}`}
                className="group relative block aspect-square overflow-hidden rounded-[14px] bg-raised"
              >
                <Image
                  src={post.imageUrl!}
                  alt={sparkPreview(post.kind, post.body, 120)}
                  fill
                  sizes="(min-width: 768px) 230px, 50vw"
                  loading={index < 6 ? "eager" : "lazy"}
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.04] motion-reduce:transition-none"
                />
                <span className="absolute top-2 left-2 inline-flex size-7 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm">
                  <KindIcon className="size-3.5" aria-hidden />
                  <span className="sr-only">{label}</span>
                </span>
                <span className="absolute inset-0 flex items-end bg-gradient-to-t from-black/65 via-black/0 to-black/0 p-3 font-mono text-sm text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <span className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <Heart className="size-4 fill-current" aria-hidden />
                      {post.likeCount}
                      <span className="sr-only">{post.likeCount === 1 ? " like" : " likes"}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="size-4" aria-hidden />
                      {post.commentCount}
                      <span className="sr-only">{post.commentCount === 1 ? " comment" : " comments"}</span>
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <ListFooter
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        failed={query.isFetchNextPageError}
        error={query.error}
        fetchNextPage={query.fetchNextPage}
        loadingLabel="Loading more pictures"
      />
    </div>
  );
}
