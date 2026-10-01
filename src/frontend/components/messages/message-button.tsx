"use client";

import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/problem";
import type { Conversation } from "@/lib/api/types";

/** Opens the conversation with a member, starting it the first time. Compact drops the icon, for tight lists. */
export function MessageButton({ username, compact = false }: { username: string; compact?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function open() {
    startTransition(async () => {
      try {
        const conversation = await api<Conversation>("/conversations", { method: "POST", json: { username } });
        router.push(`/messages/${conversation.id}`);
      } catch (error) {
        toast.error(errorMessage(error));
      }
    });
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={open}
        disabled={pending}
        aria-busy={pending}
        className="inline-flex h-[34px] shrink-0 items-center rounded-[10px] bg-raised px-3 text-[13px] font-semibold text-ink transition-colors hover:bg-line disabled:opacity-60"
      >
        {pending ? "Opening…" : "Message"}
        <span className="sr-only"> {username}</span>
      </button>
    );
  }

  return (
    <Button variant="secondary" size="sm" onClick={open} disabled={pending}>
      <MessageCircle aria-hidden />
      {pending ? "Opening…" : "Message"}
    </Button>
  );
}
