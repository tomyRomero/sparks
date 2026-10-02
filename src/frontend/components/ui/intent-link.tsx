"use client";

import Link from "next/link";
import { useState } from "react";

type IntentLinkProps = Omit<React.ComponentProps<typeof Link>, "prefetch">;

/**
 * A link that prefetches its page when a pointer, a finger or the keyboard
 * reaches it, rather than as soon as it scrolls into view. A prefetch renders
 * the page on the server, and feeds and lists show hundreds of links to
 * profiles and sparks, so prefetching every one in view would cost far more
 * than the few a reader opens. For links repeated on every item of a list.
 */
export function IntentLink({ onPointerEnter, onTouchStart, onFocus, ...props }: IntentLinkProps) {
  const [intent, setIntent] = useState(false);
  return (
    <Link
      {...props}
      prefetch={intent ? null : false}
      onPointerEnter={(event) => {
        setIntent(true);
        onPointerEnter?.(event);
      }}
      onTouchStart={(event) => {
        setIntent(true);
        onTouchStart?.(event);
      }}
      onFocus={(event) => {
        setIntent(true);
        onFocus?.(event);
      }}
    />
  );
}
