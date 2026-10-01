"use client";

import { type Query, useQueryClient } from "@tanstack/react-query";
import { Check, UserPlus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/problem";
import type { FollowState } from "@/lib/api/types";
import { queryKeys } from "@/lib/queries/keys";
import { cn } from "@/lib/utils";

export type FollowControl = ReturnType<typeof useFollow>;

/** A home feed showing only the people the viewer follows. */
function isFollowingFeed(query: Query) {
  const [, list, filter] = query.queryKey;
  return list === "feed" && (filter as { following?: boolean } | undefined)?.following === true;
}

/**
 * Follow state that changes on tap and syncs with the API one request at a
 * time, as likes do: taps made while a request is out only change what's
 * sent next.
 */
export function useFollow(username: string, initial: FollowState, signedIn: boolean) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [state, setState] = useState(initial);
  const server = useRef(initial);
  const wanted = useRef<boolean | null>(null);
  const syncing = useRef(false);

  async function sync() {
    syncing.current = true;
    try {
      while (wanted.current !== null && wanted.current !== server.current.following) {
        const following = wanted.current;
        server.current = await api<FollowState>(`/users/${username}/follow`, { method: following ? "PUT" : "DELETE" });
      }
      setState(server.current);
      // The Following feed now has more or less in it; one on screen refetches.
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts, predicate: isFollowingFeed });
      // Lists of people are fetched afresh next time they're opened.
      void queryClient.invalidateQueries({ queryKey: queryKeys.people, refetchType: "none" });
    } catch (error) {
      setState(server.current);
      toast.error(errorMessage(error));
    } finally {
      wanted.current = null;
      syncing.current = false;
    }
  }

  function setFollowing(following: boolean) {
    if (!signedIn) {
      router.push(`/sign-in?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (following === state.following) return;

    setState((current) => ({ following, followerCount: current.followerCount + (following ? 1 : -1) }));
    wanted.current = following;
    if (!syncing.current) void sync();
  }

  return { state, toggle: () => setFollowing(!state.following) };
}

type FollowButtonProps = {
  username: string;
  following: boolean;
  /** Only the button uses it, so a list row needn't know the count. */
  followerCount?: number;
  signedIn: boolean;
  className?: string;
};

export function FollowButton({ username, following, followerCount = 0, signedIn, className }: FollowButtonProps) {
  const follow = useFollow(username, { following, followerCount }, signedIn);
  return <FollowToggle follow={follow} username={username} className={className} />;
}

/**
 * Follow, or Following once followed. Pointing at or tabbing to Following
 * says Unfollow, so the label names what a press will do; right after a
 * follow it waits for the pointer to leave, so the click that followed
 * doesn't land on a red Unfollow.
 */
export function FollowToggle({
  follow,
  username,
  className,
}: {
  follow: FollowControl;
  username: string;
  className?: string;
}) {
  const { state, toggle } = follow;
  const [justFollowed, setJustFollowed] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  function press() {
    setJustFollowed(!state.following);
    setAnnouncement(state.following ? `Unfollowed @${username}` : `Following @${username}`);
    toggle();
  }

  const handle = <span className="sr-only"> @{username}</span>;
  return (
    <>
      {state.following ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={press}
          onPointerLeave={() => setJustFollowed(false)}
          className={cn(
            "group min-w-[7.5rem]",
            !justFollowed && "hover:border-danger/40 hover:bg-danger/8 hover:text-danger",
            "focus-visible:border-danger/40 focus-visible:bg-danger/8 focus-visible:text-danger",
            className,
          )}
        >
          <span className={cn("contents group-focus-visible:hidden", !justFollowed && "group-hover:hidden")}>
            <Check aria-hidden />
            Following
          </span>
          <span className={cn("hidden group-focus-visible:contents", !justFollowed && "group-hover:contents")}>
            Unfollow
            {handle}
          </span>
        </Button>
      ) : (
        <Button size="sm" onClick={press} className={cn("min-w-[7.5rem]", className)}>
          <UserPlus aria-hidden />
          Follow
          {handle}
        </Button>
      )}
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </>
  );
}
