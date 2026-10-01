"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { forgetAllDrafts } from "@/lib/compose-draft";
import { forgetAllSearches } from "@/lib/recent-searches";

/** `signingOut` stays true until the next page renders, so the control never looks idle. */
export function useSignOut() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      setSigningOut(false);
      toast.error("Couldn't sign out. Try again.");
      return;
    }
    // Nothing of theirs stays for whoever uses this browser next.
    queryClient.clear();
    forgetAllSearches();
    forgetAllDrafts();
    toast.success("Signed out. See you soon.");
    router.replace("/");
    router.refresh();
  }

  return { signingOut, signOut };
}
