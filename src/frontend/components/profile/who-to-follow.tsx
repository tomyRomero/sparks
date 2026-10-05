"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Member } from "@/lib/api/types";
import { queryKeys } from "@/lib/queries/keys";
import { FollowButton } from "./follow-button";
import { MemberRow } from "./member-list";
import { MemberListSkeleton } from "./profile-skeletons";

/**
 * A few members worth following, for an empty Following feed. Following
 * one refreshes the feed, so their sparks take this list's place.
 */
export function WhoToFollow() {
  const suggestions = useQuery({
    queryKey: queryKeys.suggestions,
    queryFn: () => api<Member[]>("/users/me/suggestions?limit=5"),
  });

  if (suggestions.isPending) {
    return (
      <div className="mt-6 overflow-hidden rounded-[14px] border border-line text-left">
        <MemberListSkeleton count={3} />
      </div>
    );
  }
  if (!suggestions.data?.length) return null;

  return (
    <section aria-labelledby="who-to-follow" className="mt-6 text-left">
      <h2 id="who-to-follow" className="mb-2 label-mono">
        Who to follow
      </h2>
      {/* The last row's divider tucks under the border, as in a Panel. */}
      <div className="overflow-hidden rounded-[14px] border border-line">
        <ul className="-mb-px">
          {suggestions.data.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              action={<FollowButton username={member.username} following={member.followedByMe} signedIn />}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
