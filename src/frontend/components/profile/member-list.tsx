"use client";

import { ChevronRight } from "lucide-react";
import { Marked } from "@/components/search/highlight";
import { Avatar } from "@/components/ui/avatar";
import { IntentLink } from "@/components/ui/intent-link";
import { ListFooter } from "@/components/ui/list-footer";
import type { UserSummary } from "@/lib/api/types";
import type { ListPaging } from "@/lib/queries/use-paged-list";
import { cn } from "@/lib/utils";

type ListedMember = UserSummary & { bio?: string | null };

type MemberListProps<M extends ListedMember> = {
  members: M[];
  paging: ListPaging;
  empty: React.ReactNode;
  /** These are the last search's results, shown faded while the new ones load. */
  stale?: boolean;
  /** Something to press on the row's end, such as Follow, in place of the arrow. */
  action?: (member: M) => React.ReactNode;
};

export function MemberList<M extends ListedMember>({
  members,
  paging,
  empty,
  stale = false,
  action,
}: MemberListProps<M>) {
  const fade = cn("transition-opacity duration-200", stale && "pointer-events-none opacity-50");
  if (members.length === 0) {
    return <div className={cn("px-6 py-16 text-center", fade)}>{empty}</div>;
  }

  return (
    <div aria-busy={stale} className={fade}>
      <ul>
        {members.map((member) => (
          <MemberRow key={member.id} member={member} action={action?.(member)} />
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

/** One member: their picture, names and bio, linked to their profile, with an optional action at the end. */
export function MemberRow({ member, action }: { member: ListedMember; action?: React.ReactNode }) {
  return (
    <li className="relative flex items-center gap-3 border-b border-line px-4 py-3 transition-colors has-[a:hover]:bg-raised/60 sm:px-6">
      <Avatar name={member.displayName} src={member.avatarUrl} size={44} />
      <span className="min-w-0 flex-1">
        {/* The link covers the row; the action sits above it. */}
        <IntentLink
          href={`/u/${member.username}`}
          className="block truncate font-semibold after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-brand/50 focus-visible:after:ring-inset"
        >
          <Marked text={member.displayName} />
        </IntentLink>
        <span className="block truncate label-mono">
          @<Marked text={member.username} />
        </span>
        {member.bio && <span className="mt-1 line-clamp-1 block text-sm text-ink-soft">{member.bio}</span>}
      </span>
      {action === undefined ? (
        <ChevronRight className="size-4 text-muted" aria-hidden />
      ) : (
        <span className="relative">{action}</span>
      )}
    </li>
  );
}
