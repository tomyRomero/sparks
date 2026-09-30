import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { CommentSection } from "@/components/comments/comment-section";
import { PostDetail } from "@/components/posts/post-detail";
import { PageHeader } from "@/components/shell/page-header";
import { serverGetOrNull } from "@/lib/api/server";
import type { Comment, CursorPage, Post } from "@/lib/api/types";
import { getViewer } from "@/lib/auth/viewer";
import { isId } from "@/lib/ids";
import { excerpt } from "@/lib/text";

/** One fetch per request, shared by the page and its metadata. */
const getPost = cache((id: string) => (isId(id) ? serverGetOrNull<Post>(`/api/v1/posts/${id}`) : null));

export async function generateMetadata({ params }: PageProps<"/p/[id]">): Promise<Metadata> {
  const post = await getPost((await params).id);
  if (!post) return { title: "Spark not found" };
  return { title: `${post.author.displayName}: “${excerpt(post.body, 60)}”`, description: excerpt(post.body, 160) };
}

export default async function PostPage({ params }: PageProps<"/p/[id]">) {
  const { id } = await params;
  const [viewer, post, comments] = await Promise.all([
    getViewer(),
    getPost(id),
    isId(id) ? serverGetOrNull<CursorPage<Comment>>(`/api/v1/posts/${id}/comments`) : null,
  ]);
  if (!post || !comments) notFound();

  return (
    <>
      <PageHeader title="Spark" back="/" />
      <PostDetail initial={post} viewer={viewer} />
      <CommentSection postId={post.id} initial={comments} viewer={viewer} />
    </>
  );
}
