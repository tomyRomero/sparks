"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { focusSearchOnArrival, SEARCH_BOX_ID } from "@/lib/search-focus";

/** "/" goes to search from anywhere, unless it's being typed or a dialog or menu is open. */
export function SearchShortcut() {
  const router = useRouter();
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey || event.defaultPrevented) return;
      if (busyElsewhere(event.target)) return;
      event.preventDefault();
      const box = document.getElementById(SEARCH_BOX_ID);
      if (box instanceof HTMLInputElement) {
        box.focus();
        box.select();
        return;
      }
      focusSearchOnArrival();
      router.push("/search");
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [router]);
  return null;
}

function busyElsewhere(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.closest("input, textarea, select, [role=dialog], [role=alertdialog], [role=menu]") !== null)
  );
}
