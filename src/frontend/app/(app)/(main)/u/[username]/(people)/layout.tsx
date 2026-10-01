import { notFound } from "next/navigation";
import { FollowTabs } from "@/components/profile/follow-tabs";
import { PageHeader } from "@/components/shell/page-header";
import { getProfile } from "@/lib/profiles";

/** A member's followers and the people they follow, under their name and back to their profile. */
export default async function PeopleLayout({ params, children }: LayoutProps<"/u/[username]">) {
  const profile = await getProfile((await params).username);
  if (!profile) notFound();

  return (
    <>
      <PageHeader title={profile.displayName} back={`/u/${profile.username}`} />
      <FollowTabs profile={profile} />
      {children}
    </>
  );
}
