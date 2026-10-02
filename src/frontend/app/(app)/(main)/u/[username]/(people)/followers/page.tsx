import type { Metadata } from "next";
import { PeopleList } from "@/components/profile/people-list";
import { PageTop } from "@/components/ui/page-top";
import type { Member, OpaquePage } from "@/lib/api/types";
import { getProfile, getProfileList } from "@/lib/profiles";
import { queryKeys } from "@/lib/queries/keys";

export async function generateMetadata({ params }: PageProps<"/u/[username]/followers">): Promise<Metadata> {
  const profile = await getProfile((await params).username);
  return { title: profile ? `People following ${profile.displayName} (@${profile.username})` : "Member not found" };
}

export default async function FollowersPage({ params }: PageProps<"/u/[username]/followers">) {
  const { viewer, profile, path, first, own } = await getProfileList<OpaquePage<Member>>(
    (await params).username,
    "followers",
  );

  return (
    <>
      <PageTop />
      <PeopleList
        initial={first}
        path={path}
        queryKey={queryKeys.followList(profile.username, "followers")}
        viewerId={viewer?.id ?? null}
        empty={
          <p className="text-muted">{own ? "No one follows you yet." : `No one follows ${profile.displayName} yet.`}</p>
        }
      />
    </>
  );
}
