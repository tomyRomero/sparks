"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";

/**
 * Signs the member out of this session. `signingOut` stays true until the
 * next page replaces the one showing it, so the control never looks idle
 * while the app is still on its way out.
 */
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
    // Nothing of theirs stays cached for whoever uses this tab next.
    queryClient.clear();
    toast.success("Signed out. See you soon.");
    router.replace("/");
    router.refresh();
  }

  return { signingOut, signOut };
}
