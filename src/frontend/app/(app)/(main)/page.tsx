import { Suspense } from "react";
import { ComposerPrompt } from "@/components/posts/composer-prompt";
import { Feed } from "@/components/posts/feed";
import { KindFilter } from "@/components/posts/kind-filter";
import { FeedSkeleton } from "@/components/posts/post-skeletons";
import { PageHeader } from "@/components/shell/page-header";
import { serverGet } from "@/lib/api/server";
import type { CursorPage, Post, SparkKind } from "@/lib/api/types";
import { getViewer } from "@/lib/auth/viewer";
import { isKind, kindInfo } from "@/lib/kinds";
import { queryKeys } from "@/lib/queries/keys";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const { kind: kindParam } = await searchParams;
  const kind = isKind(kindParam) ? kindParam : undefined;
  const viewer = await getViewer();

  // Keyed by kind so only the list falls back to a skeleton.
  return (
    <>
      <PageHeader title={kind ? kindInfo(kind).label : "Home"}>
        <span className="label-mono max-sm:hidden">Newest first</span>
      </PageHeader>
      {viewer && <ComposerPrompt viewer={viewer} />}
      <KindFilter active={kind} />
      <Suspense key={kind ?? "all"} fallback={<FeedSkeleton />}>
        <HomeFeed kind={kind} signedIn={viewer !== null} />
      </Suspense>
    </>
  );
}

async function HomeFeed({ kind, signedIn }: { kind: SparkKind | undefined; signedIn: boolean }) {
  const path = kind ? `/posts?kind=${kind}` : "/posts";
  const first = await serverGet<CursorPage<Post>>(`/api/v1${path}`);
  return (
    <Feed
      initial={first}
      path={path}
      queryKey={queryKeys.feed({ kind })}
      signedIn={signedIn}
      empty={
        <>
          <p className="font-display text-lg font-semibold">
            {kind ? `No ${kindInfo(kind).label.toLowerCase()} sparks yet` : "No sparks yet"}
          </p>
          <p className="mt-1 text-muted">Be the first to share one.</p>
        </>
      }
    />
  );
}
