"use client";

import { Panel } from "@/components/ui/panel";
import type { Member, OpaquePage } from "@/lib/api/types";
import { usePagedList } from "@/lib/queries/use-paged-list";
import { FollowButton } from "./follow-button";
import { MemberList } from "./member-list";
import { MemberListSkeleton } from "./profile-skeletons";

type PeopleListProps = {
  initial: OpaquePage<Member>;
  path: string;
  queryKey: readonly unknown[];
  /** The signed-in member, who gets no button on their own row; null for a guest. */
  viewerId: number | null;
  empty: React.ReactNode;
};

/** A paged list of members, each with a Follow button. */
export function PeopleList({ initial, path, queryKey, viewerId, empty }: PeopleListProps) {
  const { query, items } = usePagedList<Member, string>(path, queryKey, initial);
  return (
    <Panel>
      {query.isPending ? (
        <MemberListSkeleton />
      ) : (
        <MemberList
          members={items}
          paging={query}
          empty={empty}
          action={(member) =>
            member.id !== viewerId && (
              <FollowButton username={member.username} following={member.followedByMe} signedIn={viewerId !== null} />
            )
          }
        />
      )}
    </Panel>
  );
}
