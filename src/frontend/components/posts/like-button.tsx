"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/problem";
import type { LikeState } from "@/lib/api/types";
import { updateCachedComment, updateCachedPost } from "@/lib/queries/cache";
import { cn } from "@/lib/utils";

type LikeTarget = { kind: "post" | "comment"; id: number };

export type LikeControl = ReturnType<typeof useLike>;

/**
 * Like state that changes on tap and syncs with the API one request at a
 * time. Taps made while a request is out only change what's sent next, so
 * a quick like-unlike can't reach the server in the wrong order.
 */
export function useLike(target: LikeTarget, initial: LikeState, signedIn: boolean) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [state, setState] = useState(initial);
  // Bumped on every like, to replay the animation.
  const [burst, setBurst] = useState(0);
  const server = useRef(initial);
  const wanted = useRef<boolean | null>(null);
  const syncing = useRef(false);

  async function sync() {
    syncing.current = true;
    try {
      while (wanted.current !== null && wanted.current !== server.current.liked) {
        const liked = wanted.current;
        server.current = await api<LikeState>(`/${target.kind}s/${target.id}/like`, {
          method: liked ? "PUT" : "DELETE",
        });
      }
      const settled = server.current;
      setState(settled);
      const update = { likedByMe: settled.liked, likeCount: settled.likeCount };
      if (target.kind === "post") {
        updateCachedPost(queryClient, target.id, (post) => ({ ...post, ...update }));
      } else {
        updateCachedComment(queryClient, target.id, (comment) => ({ ...comment, ...update }));
      }
    } catch (error) {
      setState(server.current);
      toast.error(errorMessage(error));
    } finally {
      wanted.current = null;
      syncing.current = false;
    }
  }

  function setLiked(liked: boolean) {
    if (!signedIn) {
      router.push(`/sign-in?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (liked === state.liked) return;

    setState((current) => ({ liked, likeCount: current.likeCount + (liked ? 1 : -1) }));
    if (liked) setBurst((count) => count + 1);
    wanted.current = liked;
    if (!syncing.current) void sync();
  }

  return { state, burst, toggle: () => setLiked(!state.liked), like: () => setLiked(true) };
}

type LikeButtonProps = {
  target: LikeTarget;
  liked: boolean;
  count: number;
  signedIn: boolean;
  size?: "md" | "sm";
};

export function LikeButton({ target, liked, count, signedIn, size }: LikeButtonProps) {
  const like = useLike(target, { liked, likeCount: count }, signedIn);
  return <LikeToggle like={like} size={size} />;
}

export function LikeToggle({ like, size = "md" }: { like: LikeControl; size?: "md" | "sm" }) {
  const { state, burst, toggle } = like;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={state.liked}
      className={cn(
        "group inline-flex items-center font-mono text-muted transition-colors hover:bg-like/10 hover:text-like",
        size === "sm"
          ? "gap-1.5 rounded-md px-2 py-1 text-[11px]"
          : "h-[34px] gap-[7px] rounded-[9px] px-2.5 text-[12.5px]",
        state.liked && "text-like",
      )}
    >
      <span className="relative inline-flex">
        <Heart
          // A new element per like, so the pop plays every time.
          key={`heart-${burst}`}
          className={cn(
            size === "sm" ? "size-3.5" : "size-[18px]",
            "transition-transform duration-150 group-active:scale-[0.82]",
            state.liked && "fill-current",
            state.liked && burst > 0 && "animate-heart-pop",
          )}
          aria-hidden
        />
        {state.liked && burst > 0 && <LikeBurst key={`burst-${burst}`} />}
      </span>
      {/* A toggle keeps one name ("Like"); aria-pressed says whether it's on. */}
      <span className="sr-only">Like, </span>
      <RollingCount value={state.likeCount} />
      <span className="sr-only">{state.likeCount === 1 ? " like" : " likes"}</span>
    </button>
  );
}

const SPARKS = 8;

/** A ring and a few sparks thrown off the heart. */
function LikeBurst() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 motion-reduce:hidden">
      <span className="absolute -inset-1.5 animate-like-ring rounded-full border-2 border-like" />
      {Array.from({ length: SPARKS }, (_, index) => (
        <span
          key={index}
          className={cn(
            "absolute top-1/2 left-1/2 size-[3px] animate-like-spark rounded-full",
            index % 2 ? "bg-charge-bright" : "bg-like",
          )}
          style={{ "--angle": `${(360 / SPARKS) * index}deg` } as React.CSSProperties}
        />
      ))}
    </span>
  );
}

/** The new number rolls in from below when it goes up, from above when it goes down. */
function RollingCount({ value }: { value: number }) {
  const [shown, setShown] = useState({ value, roll: "" });
  if (shown.value !== value) {
    setShown({ value, roll: value > shown.value ? "animate-roll-up" : "animate-roll-down" });
  }

  return (
    <span className="inline-flex overflow-hidden tabular-nums">
      <span key={value} className={cn("inline-block", shown.roll)}>
        {value}
      </span>
    </span>
  );
}
