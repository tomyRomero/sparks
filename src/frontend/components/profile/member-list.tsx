"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Marked } from "@/components/search/highlight";
import { Avatar } from "@/components/ui/avatar";
import { ListFooter } from "@/components/ui/list-footer";
import type { UserSummary } from "@/lib/api/types";
import type { ListPaging } from "@/lib/queries/use-paged-list";
import { cn } from "@/lib/utils";

type MemberListProps = {
  members: UserSummary[];
  paging: ListPaging;
  empty: React.ReactNode;
  /** These are the last search's results, shown faded while the new ones load. */
  stale?: boolean;
};

export function MemberList({ members, paging, empty, stale = false }: MemberListProps) {
  const fade = cn("transition-opacity duration-200", stale && "pointer-events-none opacity-50");
  if (members.length === 0) {
    return <div className={cn("px-6 py-16 text-center", fade)}>{empty}</div>;
  }

  return (
    <div aria-busy={stale} className={fade}>
      <ul>
        {members.map((member) => (
          <li key={member.id}>
            <Link
              href={`/u/${member.username}`}
              className="flex items-center gap-3 border-b border-line px-4 py-3 transition-colors hover:bg-raised/60 sm:px-6"
            >
              <Avatar name={member.displayName} src={member.avatarUrl} size={44} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">
                  <Marked text={member.displayName} />
                </span>
                <span className="block truncate label-mono">
                  @<Marked text={member.username} />
                </span>
              </span>
              <ChevronRight className="size-4 text-muted" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      {!stale && (
        <ListFooter
          hasNextPage={paging.hasNextPage}
          isFetchingNextPage={paging.isFetchingNextPage}
          failed={paging.isFetchNextPageError}
          error={paging.error}
          fetchNextPage={paging.fetchNextPage}
          loadingLabel="Loading more members"
        />
      )}
    </div>
  );
}
