"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/problem";
import type { Conversation } from "@/lib/api/types";
import { MemberLine, MemberPicker } from "./member-picker";

export function NewMessageDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [opening, setOpening] = useState<string | null>(null);

  async function start(username: string) {
    setOpening(username);
    try {
      const conversation = await api<Conversation>("/conversations", { method: "POST", json: { username } });
      onOpenChange(false);
      router.push(`/messages/${conversation.id}`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setOpening(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="New message" description="Find someone by name or username.">
      <MemberPicker label="Search members" placeholder="Search people">
        {(member) => (
          <button
            type="button"
            onClick={() => start(member.username)}
            disabled={opening !== null}
            aria-busy={opening === member.username}
            className="flex w-full items-center gap-3 rounded-xl p-2 transition-colors hover:bg-raised disabled:opacity-60"
          >
            <MemberLine member={member} />
            {opening === member.username && <LoaderCircle className="size-4 animate-spin text-muted" aria-hidden />}
          </button>
        )}
      </MemberPicker>
    </Dialog>
  );
}
