/**
 * A marker pinned to the top of the document, for Next.js's scroll check.
 * After a link is followed, Next scrolls to the top unless the new page's
 * first elements are already on screen. A sticky header always looks on
 * screen, and a profile's tabs render below a header drawn by the layout, so
 * a page opened from far down a long one could stay scrolled to its bottom.
 * Rendered first, this is on screen only when the window is already at the
 * top. Back and Forward keep their own scroll positions either way.
 */
export function PageTop() {
  return <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px" />;
}
