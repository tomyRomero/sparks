"use client";

import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/problem";
import type { Conversation } from "@/lib/api/types";

/** Opens the conversation with a member, starting it the first time. */
export function MessageButton({ username }: { username: string }) {
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

  return (
    <Button variant="secondary" size="sm" onClick={open} disabled={pending}>
      <MessageCircle aria-hidden />
      {pending ? "Opening…" : "Message"}
    </Button>
  );
}
