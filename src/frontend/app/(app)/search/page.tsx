import type { Metadata } from "next";
import Link from "next/link";
import { Feed } from "@/components/posts/feed";
import { MemberList } from "@/components/profile/member-list";
import { SearchForm } from "@/components/search/search-form";
import { PageHeader } from "@/components/shell/page-header";
import { TabNav } from "@/components/ui/tab-nav";
import { serverGet } from "@/lib/api/server";
import type { CursorPage, Post, UserSummary } from "@/lib/api/types";
import { getViewer } from "@/lib/auth/viewer";
import { kinds } from "@/lib/kinds";
import { queryKeys } from "@/lib/queries/keys";

type SearchProps = PageProps<"/search">;

/** The query and tab from the URL: at most 100 characters, as the API allows. */
async function readSearch(searchParams: SearchProps["searchParams"]) {
  const { q, type } = await searchParams;
  const query = typeof q === "string" ? q.trim().slice(0, 100) : "";
  return { q: query, tab: type === "members" ? ("members" as const) : ("sparks" as const) };
}

export async function generateMetadata({ searchParams }: SearchProps): Promise<Metadata> {
  const { q } = await readSearch(searchParams);
  return { title: q ? `“${q}”` : "Search" };
}

export default async function SearchPage({ searchParams }: SearchProps) {
  const { q, tab } = await readSearch(searchParams);
  const encoded = encodeURIComponent(q);

  return (
    <>
      <PageHeader title="Search" />
      <SearchForm q={q} tab={tab} />
      {q ? (
        <>
          <TabNav
            label="Search results"
            tabs={[
              { href: `/search?q=${encoded}`, label: "Sparks", current: tab === "sparks" },
              { href: `/search?q=${encoded}&type=members`, label: "Members", current: tab === "members" },
            ]}
          />
          {tab === "sparks" ? <SparkResults q={q} /> : <MemberResults q={q} />}
        </>
      ) : (
        <Suggestions />
      )}
    </>
  );
}

/** Sparks whose words or author match. */
async function SparkResults({ q }: { q: string }) {
  const path = `/posts?q=${encodeURIComponent(q)}`;
  const [viewer, first] = await Promise.all([getViewer(), serverGet<CursorPage<Post>>(`/api/v1${path}`)]);
  return (
    <Feed
      key={path}
      initial={first}
      path={path}
      queryKey={queryKeys.feed({ q })}
      signedIn={viewer !== null}
      empty={<NoResults q={q} what="sparks" />}
    />
  );
}

/** Members whose name or username match. */
async function MemberResults({ q }: { q: string }) {
  const path = `/users?q=${encodeURIComponent(q)}`;
  const first = await serverGet<CursorPage<UserSummary>>(`/api/v1${path}`);
  return (
    <MemberList key={path} initial={first} path={path} queryKey={queryKeys.members(q)} empty={<NoResults q={q} what="members" />} />
  );
}

function NoResults({ q, what }: { q: string; what: string }) {
  return (
    <>
      <p className="font-display text-lg font-semibold">No {what} match “{q}”</p>
      <p className="mt-1 text-muted">Try a shorter word, or a name.</p>
    </>
  );
}

/** Before a search: what can be found, and a way to browse instead. */
function Suggestions() {
  return (
    <div className="px-4 py-8 sm:px-6">
      <p className="text-muted">Find sparks by their words or their author, and members by name.</p>
      <h2 className="mt-8 label-mono">Or browse a kind</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {kinds.map(({ kind, label, icon: Icon }) => (
          <li key={kind}>
            <Link
              href={`/?kind=${kind}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
            >
              <Icon className="size-3.5" aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
