// Set by the "/" shortcut on another page, so the search box takes focus
// when the search page arrives. Lives for the tab, like the router.
let wanted = false;

export function focusSearchOnArrival() {
  wanted = true;
}

/** Whether the box should take focus now; asking clears it. */
export function takeSearchFocus(): boolean {
  const was = wanted;
  wanted = false;
  return was;
}

/** The search box's id, so the shortcut can find it on the search page. */
export const SEARCH_BOX_ID = "search-box";
