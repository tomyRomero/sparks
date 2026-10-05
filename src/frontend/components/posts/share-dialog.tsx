"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Link2, LoaderCircle, Send } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { MemberLine, MemberPicker } from "@/components/messages/member-picker";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/problem";
import type { Conversation, OpaquePage, Post } from "@/lib/api/types";
import { kindInfo } from "@/lib/kinds";
import { queryKeys } from "@/lib/queries/keys";
import { sparkPreview } from "@/lib/spark-text";

type ShareDialogProps = {
  post: Pick<Post, "id" | "kind" | "body" | "author">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signedIn: boolean;
};

type Delivery = { state: "sending" } | { state: "sent"; conversationId: number } | { state: "failed" };

export function ShareDialog({ post, open, onOpenChange, signedIn }: ShareDialogProps) {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const [deliveries, setDeliveries] = useState<Record<string, Delivery>>({});
  const [copied, setCopied] = useState(false);
  const recent = useQuery({
    queryKey: queryKeys.recentConversations,
    queryFn: () => api<OpaquePage<Conversation>>("/conversations?limit=6"),
    enabled: open && signedIn,
  });

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(new URL(`/p/${post.id}`, window.location.origin).href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link. Your browser may not allow it here.");
    }
  }

  async function send(username: string) {
    setDeliveries((all) => ({ ...all, [username]: { state: "sending" } }));
    try {
      const conversation = await api<Conversation>("/conversations", { method: "POST", json: { username } });
      await api(`/conversations/${conversation.id}/messages`, { method: "POST", json: { sharedPostId: post.id } });
      setDeliveries((all) => ({ ...all, [username]: { state: "sent", conversationId: conversation.id } }));
      void queryClient.invalidateQueries({ queryKey: queryKeys.inbox });
    } catch (error) {
      setDeliveries((all) => ({ ...all, [username]: { state: "failed" } }));
      toast.error(errorMessage(error));
    }
  }

  const { label, icon: Icon } = kindInfo(post.kind);
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Share this spark">
      <div className="mb-4 flex items-center gap-3 rounded-xl bg-raised p-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface text-ink-soft">
          <Icon className="size-[18px]" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{sparkPreview(post.kind, post.body, 90)}</span>
          <span className="block label-mono">
            {label} by {post.author.displayName}
          </span>
        </span>
      </div>

      <Button variant="secondary" className="mb-5 h-11 w-full rounded-xl" onClick={copyLink}>
        {copied ? <Check aria-hidden /> : <Link2 aria-hidden />}
        {copied ? "Link copied" : "Copy link"}
      </Button>
      <p aria-live="polite" className="sr-only">
        {copied ? "Link copied" : ""}
      </p>

      {signedIn ? (
        <section aria-labelledby="send-to-heading">
          <h3 id="send-to-heading" className="mb-2.5 font-display text-base font-semibold">
            Send in a message
          </h3>
          <MemberPicker
            label="Search members to send to"
            placeholder="Search people"
            suggestions={{
              heading: "Recent conversations",
              members: recent.data?.items.map((conversation) => conversation.with),
            }}
          >
            {(member) => {
              const delivery = deliveries[member.username];
              return (
                <div className="flex items-center gap-3 rounded-xl p-2">
                  <MemberLine member={member} />
                  {delivery?.state === "sent" ? (
                    <Link
                      href={`/messages/${delivery.conversationId}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-success hover:bg-raised"
                    >
                      <Check className="size-4" aria-hidden />
                      Sent<span className="sr-only"> to {member.displayName}. Open the chat</span>
                    </Link>
                  ) : (
                    <Button
                      size="sm"
                      className="h-9 rounded-lg"
                      onClick={() => send(member.username)}
                      disabled={delivery?.state === "sending"}
                      aria-busy={delivery?.state === "sending"}
                    >
                      {delivery?.state === "sending" ? (
                        <LoaderCircle className="animate-spin" aria-hidden />
                      ) : (
                        <Send aria-hidden />
                      )}
                      {delivery?.state === "failed" ? "Retry" : "Send"}
                      <span className="sr-only"> to {member.displayName}</span>
                    </Button>
                  )}
                </div>
              );
            }}
          </MemberPicker>
        </section>
      ) : (
        <p className="text-center text-sm text-muted">
          <Link
            href={`/sign-in?next=${encodeURIComponent(pathname)}`}
            className="font-semibold text-brand hover:underline"
          >
            Sign in
          </Link>{" "}
          to send it to someone in a message.
        </p>
      )}
    </Dialog>
  );
}
