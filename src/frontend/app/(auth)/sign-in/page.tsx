import type { Metadata } from "next";
import Link from "next/link";
import { safeReturnPath } from "@/lib/auth/return-path";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const { next, reset } = await searchParams;
  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-muted">Sign in with your email or username.</p>
      <SignInForm returnTo={safeReturnPath(typeof next === "string" ? next : null)} passwordReset={reset === "1"} />
      <p className="mt-8 text-sm text-muted">
        New to Sparks?{" "}
        <Link href="/sign-up" className="font-medium text-brand hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
