"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/problem";
import type { CursorPage, Post } from "@/lib/api/types";
import { kindInfo } from "@/lib/kinds";
import { queryKeys } from "@/lib/queries/keys";
import { sparkPreview } from "@/lib/spark-text";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";

type SparkPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  recipient: string;
  onPick: (post: Post) => void;
};

const lists = [
  { list: "posts", label: "Your sparks", empty: "You haven't posted a spark yet." },
  { list: "liked", label: "Liked", empty: "Sparks you like show up here." },
] as const;

export function SparkPicker({ open, onOpenChange, username, recipient, onPick }: SparkPickerProps) {
  const [list, setList] = useState<"posts" | "liked">("posts");
  const query = useQuery({
    queryKey: queryKeys.sparkPicker(username, list),
    queryFn: () => api<CursorPage<Post>>(`/users/${username}/${list}?limit=20`),
    enabled: open,
  });
  const current = lists.find((option) => option.list === list)!;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={`Share a spark with ${recipient}`}>
      <div role="group" aria-label="Which sparks" className="mb-3 inline-flex rounded-xl bg-raised p-1">
        {lists.map((option) => (
          <button
            key={option.list}
            type="button"
            aria-pressed={list === option.list}
            onClick={() => setList(option.list)}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink",
              list === option.list && "bg-surface text-ink shadow-sm",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {query.isPending ? (
        <div aria-busy className="grid gap-2">
          <p role="status" className="sr-only">
            Loading sparks
          </p>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-[60px] rounded-xl" />
          ))}
        </div>
      ) : query.isError ? (
        <p role="alert" className="py-8 text-center text-sm text-danger">
          {errorMessage(query.error)}
        </p>
      ) : query.data.items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">{current.empty}</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {query.data.items.map((post) => {
            const { label, icon: Icon } = kindInfo(post.kind);
            return (
              <li key={post.id}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(post);
                    onOpenChange(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-line p-2.5 text-left transition-colors hover:border-brand hover:bg-brand-soft/40"
                >
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-raised text-ink-soft">
                    <Icon className="size-[18px]" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{sparkPreview(post.kind, post.body, 90)}</span>
                    <span className="block label-mono">
                      {list === "liked" && `${post.author.displayName} · `}
                      {label} · {timeAgo(post.createdAt)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Dialog>
  );
}
