import { ComposerPrompt } from "@/components/posts/composer-prompt";
import { Feed } from "@/components/posts/feed";
import { KindFilter } from "@/components/posts/kind-filter";
import { PageHeader } from "@/components/shell/page-header";
import { serverGet } from "@/lib/api/server";
import type { CursorPage, Post } from "@/lib/api/types";
import { getViewer } from "@/lib/auth/viewer";
import { isKind, kindInfo } from "@/lib/kinds";
import { queryKeys } from "@/lib/queries/keys";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const { kind: kindParam } = await searchParams;
  const kind = isKind(kindParam) ? kindParam : undefined;
  const path = kind ? `/posts?kind=${kind}` : "/posts";
  const [viewer, first] = await Promise.all([getViewer(), serverGet<CursorPage<Post>>(`/api/v1${path}`)]);

  return (
    <>
      <PageHeader title={kind ? kindInfo(kind).label : "Home"} />
      {viewer && <ComposerPrompt viewer={viewer} />}
      <KindFilter active={kind} />
      <Feed
        key={path}
        initial={first}
        path={path}
        queryKey={queryKeys.feed({ kind })}
        signedIn={viewer !== null}
        empty={
          <>
            <p className="font-display text-lg font-semibold">
              {kind ? `No ${kindInfo(kind).label.toLowerCase()} sparks yet` : "No sparks yet"}
            </p>
            <p className="mt-1 text-muted">Be the first to share one.</p>
          </>
        }
      />
    </>
  );
}
