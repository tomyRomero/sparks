"use client";

import { Heart } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/problem";
import type { LikeState } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type LikeButtonProps = {
  /** The API path of the thing to like: "/posts/12" or "/comments/40". */
  target: string;
  liked: boolean;
  count: number;
  signedIn: boolean;
  size?: "md" | "sm";
};

/**
 * Likes and unlikes straight away, then settles on the count the API
 * returns; a failure puts it back. Guests are sent to sign in.
 */
export function LikeButton({ target, liked: initialLiked, count: initialCount, signedIn, size = "md" }: LikeButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<LikeState>({ liked: initialLiked, likeCount: initialCount });
  const [, startTransition] = useTransition();

  function toggle() {
    if (!signedIn) {
      router.push(`/sign-in?next=${encodeURIComponent(pathname)}`);
      return;
    }

    const previous = state;
    const liked = !previous.liked;
    setState({ liked, likeCount: previous.likeCount + (liked ? 1 : -1) });
    startTransition(async () => {
      try {
        setState(await api<LikeState>(`${target}/like`, { method: liked ? "PUT" : "DELETE" }));
      } catch (error) {
        setState(previous);
        toast.error(errorMessage(error));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={state.liked}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-muted transition-colors hover:bg-like/10 hover:text-like",
        state.liked && "text-like",
        size === "sm" ? "text-[11px]" : "text-xs",
      )}
    >
      <Heart
        className={cn(size === "sm" ? "size-3.5" : "size-4", "transition-transform group-active:scale-90", state.liked && "fill-current")}
        aria-hidden
      />
      {/* A toggle keeps one name ("Like"); aria-pressed says whether it's on. */}
      <span className="sr-only">Like, </span>
      {state.likeCount}
      <span className="sr-only">{state.likeCount === 1 ? " like" : " likes"}</span>
    </button>
  );
}
