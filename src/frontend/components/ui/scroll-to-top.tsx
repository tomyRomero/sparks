"use client";

import { useLayoutEffect } from "react";

/** Scrolls the window to the top as it appears. */
export function ScrollToTop() {
  useLayoutEffect(() => {
    // Not returned: browsers have begun returning a promise from scrollTo, and
    // React would take whatever an effect returns for its cleanup.
    window.scrollTo(0, 0);
  }, []);
  return null;
}
