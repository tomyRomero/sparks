import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PeopleList } from "@/components/profile/people-list";
import { serverGetOrNull } from "@/lib/api/server";
import type { Member, OpaquePage } from "@/lib/api/types";
import { getViewer } from "@/lib/auth/viewer";
import { getProfile } from "@/lib/profiles";
import { queryKeys } from "@/lib/queries/keys";

export async function generateMetadata({ params }: PageProps<"/u/[username]/following">): Promise<Metadata> {
  const profile = await getProfile((await params).username);
  return { title: profile ? `People ${profile.displayName} follows (@${profile.username})` : "Member not found" };
}

export default async function FollowingPage({ params }: PageProps<"/u/[username]/following">) {
  const { username } = await params;
  const [viewer, profile] = await Promise.all([getViewer(), getProfile(username)]);
  if (!profile) notFound();
  const path = `/users/${profile.username}/following`;
  const first = await serverGetOrNull<OpaquePage<Member>>(`/api/v1${path}`);
  if (!first) notFound();

  return (
    <PeopleList
      initial={first}
      path={path}
      queryKey={queryKeys.followList(profile.username, "following")}
      viewerId={viewer?.id ?? null}
      empty={
        <p className="text-muted">
          {viewer?.id === profile.id
            ? "You don't follow anyone yet."
            : `${profile.displayName} doesn't follow anyone yet.`}
        </p>
      }
    />
  );
}
