import type { Metadata } from "next";
import { PeopleList } from "@/components/profile/people-list";
import { PageTop } from "@/components/ui/page-top";
import type { Member, OpaquePage } from "@/lib/api/types";
import { getProfile, getProfileList } from "@/lib/profiles";
import { queryKeys } from "@/lib/queries/keys";

export async function generateMetadata({ params }: PageProps<"/u/[username]/following">): Promise<Metadata> {
  const profile = await getProfile((await params).username);
  return { title: profile ? `People ${profile.displayName} follows (@${profile.username})` : "Member not found" };
}

export default async function FollowingPage({ params }: PageProps<"/u/[username]/following">) {
  const { viewer, profile, path, first, own } = await getProfileList<OpaquePage<Member>>(
    (await params).username,
    "following",
  );

  return (
    <>
      <PageTop />
      <PeopleList
        initial={first}
        path={path}
        queryKey={queryKeys.followList(profile.username, "following")}
        viewerId={viewer?.id ?? null}
        empty={
          <p className="text-muted">
            {own ? "You don't follow anyone yet." : `${profile.displayName} doesn't follow anyone yet.`}
          </p>
        }
      />
    </>
  );
}
