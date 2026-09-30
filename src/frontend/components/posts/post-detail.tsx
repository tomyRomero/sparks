"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/problem";
import type { CurrentUser, Post } from "@/lib/api/types";
import { limits } from "@/lib/limits";
import { forgetPostLists, updateCachedPost } from "@/lib/queries/cache";
import { queryKeys } from "@/lib/queries/keys";
import { fullDate } from "@/lib/time";
import { ItemMenu } from "./item-menu";
import { KindLabel } from "./kind-label";
import { LikeButton } from "./like-button";
import { PostBody } from "./post-body";
import { TextForm } from "./text-form";

/**
 * A spark on its own page: in full, with the prompt behind an AI draft, and
 * its author's edit and delete. It reads from the query cache, seeded by the
 * server, so likes, comments and edits anywhere on the page show at once.
 */
export function PostDetail({ initial, viewer }: { initial: Post; viewer: CurrentUser | null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: post } = useQuery({
    queryKey: queryKeys.post(initial.id),
    queryFn: () => api<Post>(`/posts/${initial.id}`),
    initialData: initial,
  });
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const mine = viewer?.id === post.author.id;

  async function save(body: string) {
    const updated = await api<Post>(`/posts/${post.id}`, { method: "PATCH", json: { body } });
    updateCachedPost(queryClient, post.id, () => updated);
    setEditing(false);
  }

  async function remove() {
    try {
      await api(`/posts/${post.id}`, { method: "DELETE" });
    } catch (error) {
      toast.error(errorMessage(error));
      return;
    }
    forgetPostLists(queryClient);
    toast.success("Spark deleted");
    router.replace("/");
  }

  return (
    <article className="border-b border-line px-4 py-5 sm:px-6">
      <header className="flex items-center gap-3">
        <Link href={`/u/${post.author.username}`} className="shrink-0" tabIndex={-1} aria-hidden>
          <Avatar name={post.author.displayName} src={post.author.avatarUrl} size={48} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/u/${post.author.username}`} className="block truncate font-semibold hover:underline">
            {post.author.displayName}
          </Link>
          <span className="label-mono">@{post.author.username}</span>
        </div>
        {mine && !editing && (
          <ItemMenu label="Spark options" onEdit={() => setEditing(true)} onDelete={() => setConfirmingDelete(true)} />
        )}
      </header>

      <div className="mt-4">
        <KindLabel kind={post.kind} aiPrompt={post.aiPrompt} />
      </div>

      <div className="mt-3">
        {editing ? (
          <TextForm
            label="Edit your spark"
            placeholder="Your spark"
            maxLength={limits.postBodyMax}
            submitLabel="Save"
            initialValue={post.body}
            focusOnOpen
            onSubmit={save}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <div className="text-lg">
            <PostBody kind={post.kind} body={post.body} />
          </div>
        )}
      </div>

      {post.imageUrl && (
        <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-lg border border-line bg-raised">
          <Image
            src={post.imageUrl}
            alt=""
            fill
            loading="eager"
            sizes="(min-width: 768px) 640px, 100vw"
            className="object-cover"
          />
        </div>
      )}

      {post.aiPrompt && (
        <aside className="mt-4 rounded-md border border-charge/25 bg-charge-soft px-4 py-3">
          <p className="flex items-center gap-1.5 font-mono text-[11px] tracking-wide text-charge uppercase">
            <Zap className="size-3.5 fill-current" aria-hidden />
            Drafted with AI from
          </p>
          <p className="mt-1 text-sm text-ink-soft">“{post.aiPrompt}”</p>
        </aside>
      )}

      <p className="mt-4 label-mono">
        <time dateTime={post.createdAt} suppressHydrationWarning>
          {fullDate(post.createdAt)}
        </time>
        {post.editedAt && (
          <span title={`Edited ${fullDate(post.editedAt)}`} suppressHydrationWarning>
            {" "}
            · edited
          </span>
        )}
      </p>

      <footer className="mt-3 -ml-2 flex items-center gap-2 border-t border-line pt-3">
        <LikeButton
          target={{ kind: "post", id: post.id }}
          liked={post.likedByMe}
          count={post.likeCount}
          signedIn={viewer !== null}
        />
        <a
          href="#comments"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-xs text-muted hover:bg-brand/10 hover:text-brand"
        >
          <MessageCircle className="size-4" aria-hidden />
          {post.commentCount}
          <span className="sr-only">{post.commentCount === 1 ? " comment" : " comments"}</span>
        </a>
      </footer>

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title="Delete this spark?"
        description="Its comments and likes go with it. This can't be undone."
        confirmLabel="Delete spark"
        onConfirm={remove}
      />
    </article>
  );
}
