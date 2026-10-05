import type { Metadata } from "next";
import { SearchView } from "@/components/search/search-view";
import { PageHeader } from "@/components/shell/page-header";
import { serverGet } from "@/lib/api/server";
import type { CursorPage, Post, SearchCounts, UserSummary } from "@/lib/api/types";
import { getViewer } from "@/lib/auth/viewer";
import { memberSearchPath, readSearch, searchHref, sparkSearchPath } from "@/lib/search";

type SearchProps = PageProps<"/search">;

export async function generateMetadata({ searchParams }: SearchProps): Promise<Metadata> {
  const { q } = readSearch(await searchParams);
  return { title: q ? `“${q}”` : "Search" };
}

export default async function SearchPage({ searchParams }: SearchProps) {
  const search = readSearch(await searchParams);
  const { q, tab, kinds } = search;
  const [viewer, sparks, members, counts] = await Promise.all([
    getViewer(),
    q && tab === "sparks" ? serverGet<CursorPage<Post>>(`/api/v1${sparkSearchPath(q, kinds)}`) : undefined,
    q && tab === "members" ? serverGet<CursorPage<UserSummary>>(`/api/v1${memberSearchPath(q)}`) : undefined,
    q ? serverGet<SearchCounts>(`/api/v1/search/counts?${new URLSearchParams({ q })}`) : undefined,
  ]);

  // Typing changes the URL without coming back here; a link to another
  // search does, and starts the view again under its own key.
  return (
    <>
      <PageHeader title="Search" />
      <SearchView
        key={searchHref(search)}
        initialSearch={search}
        sparks={sparks}
        members={members}
        counts={counts}
        signedIn={viewer !== null}
      />
    </>
  );
}
