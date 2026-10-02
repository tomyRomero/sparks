"use client";

import { Heart } from "lucide-react";
import Image from "next/image";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Marked } from "@/components/search/highlight";
import { IntentLink } from "@/components/ui/intent-link";
import type { Post } from "@/lib/api/types";
import { haikuLines, splitSpark } from "@/lib/spark-text";
import { cn } from "@/lib/utils";

type SparkContentProps = {
  post: Pick<Post, "id" | "kind" | "body" | "imageUrl">;
  /** "card" in lists, cut to fit; "page" on the spark's own page, in full and larger. */
  variant: "card" | "page";
  /** Load the picture straight away: it's likely the largest thing on screen. */
  eagerImage?: boolean;
  /** On the spark's own page: a double tap on the picture likes it. */
  onDoubleTap?: () => void;
};

export function SparkContent({ post, variant, eagerImage = false, onDoubleTap }: SparkContentProps) {
  const card = variant === "card";
  const { title, text, punchline } = splitSpark(post.kind, post.body);
  const href = `/p/${post.id}`;
  const linked = (content: React.ReactNode, className?: string) =>
    card ? (
      <IntentLink href={href} className={cn("block", className)}>
        {content}
      </IntentLink>
    ) : (
      <div className={className}>{content}</div>
    );
  const picture = (frame: string, sizes: string, imageClassName?: string) =>
    post.imageUrl && (
      <Picture
        src={post.imageUrl}
        href={card ? href : null}
        frame={frame}
        sizes={sizes}
        eager={eagerImage || !card}
        className={imageClassName}
        onDoubleTap={card ? undefined : onDoubleTap}
      />
    );
  const columnSizes = "(min-width: 768px) 600px, 100vw";

  switch (post.kind) {
    case "movieScript":
      return (
        <div className="overflow-hidden rounded-[14px] bg-screen text-screen-ink">
          {post.imageUrl ? (
            <div className="relative">
              {picture("aspect-[2.39/1] rounded-none", columnSizes)}
              {title && (
                <>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 to-transparent"
                  />
                  <p
                    className={cn(
                      "pointer-events-none absolute right-5 bottom-4 left-5 font-display font-extrabold tracking-[0.14em] uppercase",
                      card ? "text-xl sm:text-[26px]" : "text-2xl sm:text-3xl",
                    )}
                  >
                    <Marked text={title} />
                  </p>
                </>
              )}
            </div>
          ) : (
            title && (
              <p
                className={cn(
                  "px-5 pt-5 font-display font-extrabold tracking-[0.14em] uppercase sm:px-6",
                  card ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl",
                )}
              >
                <Marked text={title} />
              </p>
            )
          )}
          {text &&
            linked(
              <>
                <span className="block font-mono text-[11px] text-screen-muted">Logline</span>
                <span
                  className={cn(
                    "mt-2 block font-script leading-relaxed whitespace-pre-line",
                    card ? "line-clamp-6 text-[14.5px]" : "text-base",
                  )}
                >
                  <Marked text={text} />
                </span>
              </>,
              "px-5 pt-4 pb-5 sm:px-6",
            )}
        </div>
      );

    case "bookPlot":
      return (
        <div className="flex items-start gap-4">
          {picture(
            cn(
              "aspect-[2/3] shrink-0 rounded-[4px_10px_10px_4px] shadow-[0_10px_22px_-12px_rgb(10_20_36/0.5)]",
              card ? "w-28 sm:w-[132px]" : "w-32 sm:w-44",
            ),
            "176px",
          )}
          {linked(
            <>
              {title && (
                <span
                  className={cn(
                    "block font-display leading-tight font-bold tracking-tight",
                    card ? "text-xl" : "text-2xl",
                  )}
                >
                  <Marked text={title} />
                </span>
              )}
              <span
                className={cn(
                  "mt-2 block leading-relaxed whitespace-pre-line text-ink-soft",
                  card ? "line-clamp-[8] text-sm sm:text-[15px]" : "text-base",
                )}
              >
                <Marked text={text} />
              </span>
            </>,
            "min-w-0 flex-1",
          )}
        </div>
      );

    case "artwork":
      return (
        <div className="flex flex-col gap-3">
          {picture(cn("mx-auto aspect-[4/5] w-full", card ? "max-w-[416px]" : "max-w-[480px]"), "480px")}
          {linked(
            <>
              {title && (
                <span className={cn("block font-display font-bold", card ? "text-[21px]" : "text-2xl")}>
                  <Marked text={title} />
                </span>
              )}
              <span
                className={cn(
                  "mt-1.5 block leading-relaxed whitespace-pre-line text-ink-soft",
                  card ? "line-clamp-4 text-[15px]" : "text-base",
                )}
              >
                <Marked text={text} />
              </span>
            </>,
          )}
        </div>
      );

    case "fashion":
    case "photography":
      return (
        <div className="flex flex-col gap-3">
          {picture(
            post.kind === "fashion" ? "mx-auto aspect-square w-full max-w-[480px]" : "aspect-[3/2]",
            columnSizes,
          )}
          {linked(
            <span
              className={cn(
                "block leading-relaxed whitespace-pre-line",
                card ? "line-clamp-4 text-[15px]" : "text-[17px]",
              )}
            >
              <Marked text={text} />
            </span>,
          )}
        </div>
      );

    case "haiku":
      return linked(
        <figure className={cn("m-0 rounded-[14px] bg-raised", card ? "px-6 py-5 sm:px-7" : "px-7 py-7 sm:px-9")}>
          {haikuLines(post.body).map((line, index) => (
            <span
              key={index}
              className={cn(
                "block font-display leading-snug font-medium tracking-tight",
                card ? "text-xl sm:text-2xl" : "text-2xl sm:text-[28px]",
                index === 1 && "ps-6 sm:ps-7",
              )}
            >
              <Marked text={line} />
            </span>
          ))}
        </figure>,
      );

    case "quote":
      return linked(
        <blockquote className="m-0">
          <span aria-hidden className="block h-8 font-display text-6xl leading-[0.9] font-extrabold text-brand">
            “
          </span>
          <span
            className={cn(
              "block font-display leading-tight font-semibold tracking-tight",
              card ? "text-[22px] sm:text-[26px]" : "text-3xl",
            )}
          >
            <Marked text={text} />
          </span>
        </blockquote>,
      );

    case "aphorism":
      return linked(
        <span
          className={cn(
            "block py-1 font-display leading-[1.15] font-bold tracking-[-0.025em]",
            card ? "text-[26px] sm:text-[30px]" : "text-4xl",
          )}
        >
          <Marked text={text} />
        </span>,
      );

    case "joke":
      return (
        <div className="flex flex-col gap-3">
          {linked(
            <span className={cn("block leading-normal whitespace-pre-line", card ? "text-lg" : "text-xl")}>
              <Marked text={text} />
            </span>,
          )}
          {punchline && <Punchline text={punchline} large={!card} />}
          {picture("aspect-[4/3]", columnSizes)}
        </div>
      );

    default:
      return (
        <div className="flex flex-col gap-3">
          {linked(
            <span
              className={cn("block leading-relaxed whitespace-pre-line", card ? "line-clamp-6 text-[17px]" : "text-lg")}
            >
              <Marked text={text} />
            </span>,
          )}
          {picture("aspect-[4/3]", columnSizes)}
        </div>
      );
  }
}

type PictureProps = {
  src: string;
  /** In a card, the picture links to the spark too (for pointers; the text is the link for everyone else). */
  href: string | null;
  frame: string;
  sizes: string;
  eager: boolean;
  className?: string;
  onDoubleTap?: () => void;
};

function Picture({ src, href, frame, sizes, eager, className, onDoubleTap }: PictureProps) {
  const image = (
    <Image
      src={src}
      alt=""
      fill
      sizes={sizes}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      className={cn("object-cover", className)}
    />
  );
  const frameStyle = cn("relative block overflow-hidden rounded-[14px] bg-raised", frame);
  if (href) {
    return (
      <IntentLink href={href} className={frameStyle} tabIndex={-1} aria-hidden>
        {image}
      </IntentLink>
    );
  }
  return onDoubleTap ? (
    <DoubleTap className={frameStyle} onDoubleTap={onDoubleTap}>
      {image}
    </DoubleTap>
  ) : (
    <div className={frameStyle}>{image}</div>
  );
}

/** Two taps or clicks this close together, in time and on screen, are a double tap. */
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_PX = 30;

/**
 * Likes on a double tap, with a big heart where it landed. It's a shortcut for
 * pointers; everyone has the like button, so it isn't announced or focusable.
 */
function DoubleTap({
  className,
  onDoubleTap,
  children,
}: {
  className: string;
  onDoubleTap: () => void;
  children: React.ReactNode;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [hearts, setHearts] = useState(0);
  const tapped = useEffectEvent(() => {
    onDoubleTap();
    setHearts((count) => count + 1);
  });

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    let last: { at: number; x: number; y: number } | null = null;
    const onPointerUp = (event: PointerEvent) => {
      const near = last && Math.hypot(event.clientX - last.x, event.clientY - last.y) < DOUBLE_TAP_PX;
      if (last && near && event.timeStamp - last.at < DOUBLE_TAP_MS) {
        last = null;
        window.getSelection()?.removeAllRanges();
        tapped();
        return;
      }
      last = { at: event.timeStamp, x: event.clientX, y: event.clientY };
    };
    element.addEventListener("pointerup", onPointerUp);
    return () => element.removeEventListener("pointerup", onPointerUp);
  }, []);

  return (
    <div ref={frame} className={cn(className, "touch-manipulation select-none")}>
      {children}
      {hearts > 0 && (
        <span
          key={hearts}
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <Heart className="size-24 animate-big-heart fill-like text-like drop-shadow-[0_6px_24px_rgb(0_0_0/0.35)] motion-reduce:animate-fade-flash sm:size-28" />
        </span>
      )}
    </div>
  );
}

function Punchline({ text, large }: { text: string; large: boolean }) {
  const [shown, setShown] = useState(false);
  const revealed = useRef<HTMLParagraphElement>(null);

  if (!shown) {
    return (
      <button
        type="button"
        onClick={() => {
          setShown(true);
          // The button goes; focus moves to what it revealed, so it's read out.
          requestAnimationFrame(() => revealed.current?.focus());
        }}
        className="h-[46px] w-full rounded-xl border-[1.5px] border-dashed border-line-strong text-[14.5px] font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand"
      >
        Reveal the punchline
      </button>
    );
  }

  return (
    <p
      ref={revealed}
      tabIndex={-1}
      className={cn(
        "animate-pop font-display leading-tight font-semibold tracking-[-0.015em] whitespace-pre-line outline-none",
        large ? "text-3xl" : "text-2xl",
      )}
    >
      <Marked text={text} />
    </p>
  );
}
