"use client";

import { LoaderCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSignOut } from "@/lib/auth/use-sign-out";

/** Sign-out on the settings page, the one place it's reachable on a phone. */
export function SignOutSection() {
  const { signingOut, signOut } = useSignOut();
  return (
    <section
      aria-labelledby="account-heading"
      className="mt-4 grid gap-3 rounded-[18px] border border-line bg-surface p-4 shadow-card sm:p-6"
    >
      <h2 id="account-heading" className="font-display text-lg font-semibold">
        Account
      </h2>
      <p className="text-sm text-muted">Signing out ends your session on this device.</p>
      <div>
        <Button variant="secondary" onClick={() => void signOut()} disabled={signingOut} aria-busy={signingOut}>
          {signingOut ? <LoaderCircle className="animate-spin" aria-hidden /> : <LogOut aria-hidden />}
          {signingOut ? "Signing out…" : "Sign out"}
        </Button>
      </div>
    </section>
  );
}
