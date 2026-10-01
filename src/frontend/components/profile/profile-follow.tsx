"use client";

import { createContext, use } from "react";
import type { Profile } from "@/lib/api/types";
import { type FollowControl, FollowToggle, useFollow } from "./follow-button";

const ProfileFollowContext = createContext<FollowControl | null>(null);

/** One follow state for a profile's header, so its button and follower count move together. */
export function ProfileFollow({
  profile,
  signedIn,
  children,
}: {
  profile: Profile;
  signedIn: boolean;
  children: React.ReactNode;
}) {
  const follow = useFollow(
    profile.username,
    { following: profile.followedByMe, followerCount: profile.followerCount },
    signedIn,
  );
  return <ProfileFollowContext value={follow}>{children}</ProfileFollowContext>;
}

export function ProfileFollowButton({ username }: { username: string }) {
  const follow = use(ProfileFollowContext);
  return follow && <FollowToggle follow={follow} username={username} />;
}

/** The follower count, as the follow button last left it. */
export function useFollowerCount(fallback: number): number {
  return use(ProfileFollowContext)?.state.followerCount ?? fallback;
}
