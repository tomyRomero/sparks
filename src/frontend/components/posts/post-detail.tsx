"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Zap } from "lucide-react";
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
import { AiChip, KindChip } from "./kind-label";
import { PostActions } from "./post-actions";
import { SparkContent } from "./spark-content";
import { TextForm } from "./text-form";

/** Reads from the query cache (seeded by the server) so likes and edits show at once. */
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
    <article className="flex flex-col gap-4 rounded-[18px] border border-line bg-surface p-4 shadow-card sm:p-6">
      <header className="flex items-center gap-3">
        <Link href={`/u/${post.author.username}`} className="shrink-0 rounded-full" tabIndex={-1} aria-hidden>
          <Avatar name={post.author.displayName} src={post.author.avatarUrl} size={48} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/u/${post.author.username}`} className="block truncate font-semibold hover:underline">
            {post.author.displayName}
          </Link>
          <span className="block truncate label-mono">@{post.author.username}</span>
        </div>
        {post.aiPrompt && <AiChip />}
        <KindChip kind={post.kind} />
        {mine && !editing && (
          <ItemMenu label="Spark options" onEdit={() => setEditing(true)} onDelete={() => setConfirmingDelete(true)} />
        )}
      </header>

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
        <SparkContent post={post} variant="page" />
      )}

      {post.aiPrompt && (
        <aside className="rounded-xl border border-charge/25 bg-charge-soft px-4 py-3">
          <p className="flex items-center gap-1.5 font-mono text-[11px] tracking-wide text-charge uppercase">
            <Zap className="size-3.5 fill-current" aria-hidden />
            Drafted with AI from
          </p>
          <p className="mt-1 text-sm text-ink-soft">“{post.aiPrompt}”</p>
        </aside>
      )}

      <p className="label-mono">
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

      <footer className="border-t border-line pt-3">
        <PostActions post={post} signedIn={viewer !== null} commentsHref="#comments" />
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
