import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";
import { SignOutSection } from "@/components/profile/sign-out-section";
import { PageHeader } from "@/components/shell/page-header";
import { requireViewer } from "@/lib/auth/viewer";
import { getProfile } from "@/lib/profiles";

export const metadata: Metadata = { title: "Edit profile" };

export default async function EditProfilePage() {
  const viewer = await requireViewer("/settings/profile");
  // The profile, not the session, holds the bio.
  const profile = await getProfile(viewer.username);
  if (!profile) notFound();

  return (
    <>
      <PageHeader title="Edit profile" back={`/u/${viewer.username}`} />
      <ProfileForm profile={profile} />
      <SignOutSection />
    </>
  );
}
