"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { ListFooter } from "@/components/ui/list-footer";
import type { CursorPage, UserSummary } from "@/lib/api/types";
import { usePagedList } from "@/lib/queries/use-paged-list";

type MemberListProps = {
  initial: CursorPage<UserSummary>;
  path: string;
  queryKey: readonly unknown[];
  empty: React.ReactNode;
};

/** Members as rows that open their profiles. */
export function MemberList({ initial, path, queryKey, empty }: MemberListProps) {
  const { query, items: members } = usePagedList(path, queryKey, initial);
  if (members.length === 0) {
    return <div className="px-6 py-16 text-center">{empty}</div>;
  }

  return (
    <div>
      <ul>
        {members.map((member) => (
          <li key={member.id}>
            <Link
              href={`/u/${member.username}`}
              className="flex items-center gap-3 border-b border-line px-4 py-3 transition-colors hover:bg-surface/60 sm:px-6"
            >
              <Avatar name={member.displayName} src={member.avatarUrl} size={44} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{member.displayName}</span>
                <span className="block truncate label-mono">@{member.username}</span>
              </span>
              <ChevronRight className="size-4 text-muted" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      <ListFooter
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        failed={query.isFetchNextPageError}
        error={query.error}
        fetchNextPage={query.fetchNextPage}
        loadingLabel="Loading more members"
      />
    </div>
  );
}
