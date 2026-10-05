"use client";

import { useSearchParams } from "next/navigation";
import { Segmented } from "@/components/ui/segmented";
import { feedHref, readFeedFilter } from "@/lib/feed";

const scopes = [
  { value: "everyone", label: "Everyone" },
  { value: "following", label: "Following" },
] as const;

/**
 * Everyone's sparks or only those of the people you follow, beside the
 * page title. It rewrites the URL like the feed's other filters; the feed
 * reads the URL, so it follows.
 */
export function FeedScope() {
  const params = useSearchParams();
  const filter = readFeedFilter(params);
  return (
    <Segmented
      label="Show sparks from"
      value={filter.following ? "following" : "everyone"}
      options={scopes}
      onChange={(scope) =>
        window.history.replaceState(null, "", feedHref({ ...filter, following: scope === "following" }))
      }
    />
  );
}
