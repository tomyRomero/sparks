"use client";

import { createContext, useContext } from "react";
import { matchParts } from "@/lib/text";

const SearchTerm = createContext("");

/** Highlights the term wherever a <Marked> inside shows text. */
export function HighlightProvider({ term, children }: { term: string; children: React.ReactNode }) {
  return <SearchTerm value={term}>{children}</SearchTerm>;
}

/** Text with the current search term marked; plain text outside search results. */
export function Marked({ text }: { text: string }) {
  const term = useContext(SearchTerm);
  if (!term) return text;
  return matchParts(text, term).map((part, index) =>
    part.match ? (
      <mark key={index} className="rounded-[3px] bg-mark [box-decoration-break:clone] text-inherit">
        {part.text}
      </mark>
    ) : (
      part.text
    ),
  );
}
