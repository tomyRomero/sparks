import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { CommentFocus } from "@/components/comments/comment-focus";
import { PageHeader } from "@/components/shell/page-header";
import { Panel } from "@/components/ui/panel";
import { serverGetOrNull } from "@/lib/api/server";
import type { Comment } from "@/lib/api/types";
import { getViewer } from "@/lib/auth/viewer";
import { isId } from "@/lib/ids";
import { excerpt } from "@/lib/text";

/** One fetch per request, shared by the page and its metadata. */
const getComment = cache((id: string) => (isId(id) ? serverGetOrNull<Comment>(`/api/v1/comments/${id}`) : null));

export async function generateMetadata({ params }: PageProps<"/c/[id]">): Promise<Metadata> {
  const comment = await getComment((await params).id);
  if (!comment) return { title: "Comment not found" };
  return { title: `${comment.author.displayName}: “${excerpt(comment.body, 60)}”` };
}

/** A comment and its replies, for threads nested too deep to show under the spark, and for links to a reply. */
export default async function CommentPage({ params }: PageProps<"/c/[id]">) {
  const { id } = await params;
  const [viewer, comment] = await Promise.all([getViewer(), getComment(id)]);
  if (!comment) notFound();

  return (
    <>
      <PageHeader title="Thread" back={`/p/${comment.postId}`} />
      <Panel>
        <CommentFocus initial={comment} viewer={viewer} />
      </Panel>
    </>
  );
}
