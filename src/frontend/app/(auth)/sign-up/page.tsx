import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Create an account" };

export default function SignUpPage() {
  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Join Sparks</h1>
      <p className="mt-2 text-muted">Share your first spark in a minute.</p>
      <SignUpForm />
      <p className="mt-8 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
