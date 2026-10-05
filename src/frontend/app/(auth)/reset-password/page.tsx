import type { Metadata } from "next";
import Link from "next/link";
import { FormMessage } from "@/components/ui/form-message";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token } = await searchParams;
  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Choose a new password</h1>
      {typeof token === "string" && token ? (
        <>
          <p className="mt-2 text-muted">You&apos;ll be signed out everywhere else.</p>
          <ResetPasswordForm token={token} />
        </>
      ) : (
        <div className="mt-8 grid gap-4">
          <FormMessage tone="error">This link is missing its token. Open the link from the email again.</FormMessage>
          <Link href="/forgot-password" className="text-sm font-medium text-brand hover:underline">
            Request a new link
          </Link>
        </div>
      )}
    </>
  );
}
