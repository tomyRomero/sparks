import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { PageHeader } from "@/components/shell/page-header";
import { getViewer } from "@/lib/auth/viewer";
import { getProfile } from "@/lib/profiles";
import { excerpt } from "@/lib/text";

export async function generateMetadata({ params }: LayoutProps<"/u/[username]">): Promise<Metadata> {
  const profile = await getProfile((await params).username);
  if (!profile) return { title: "Member not found" };
  return {
    title: `${profile.displayName} (@${profile.username})`,
    description: profile.bio ? excerpt(profile.bio, 160) : `${profile.displayName}'s sparks on Sparks.`,
  };
}

/** A member's profile: the header and tabs stay put while the tabs' lists change below. */
export default async function ProfileLayout({ params, children }: LayoutProps<"/u/[username]">) {
  const { username } = await params;
  const [viewer, profile] = await Promise.all([getViewer(), getProfile(username)]);
  if (!profile) notFound();

  return (
    <>
      <PageHeader title={profile.displayName} back="/" />
      <ProfileHeader profile={profile} viewer={!viewer ? "guest" : viewer.id === profile.id ? "self" : "member"} />
      <ProfileTabs username={profile.username} />
      {children}
    </>
  );
}
