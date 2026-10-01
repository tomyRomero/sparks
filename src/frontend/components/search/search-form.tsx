import { Search } from "lucide-react";
import Form from "next/form";

// A GET form, so search works before scripts load.
export function SearchForm({ q, tab }: { q: string; tab: "sparks" | "members" }) {
  return (
    <Form action="/search" role="search" className="mb-4">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          // A new query from a link resets the box to it.
          key={q}
          type="search"
          name="q"
          defaultValue={q}
          maxLength={100}
          placeholder="Search sparks and members"
          aria-label="Search sparks and members"
          className="h-12 w-full rounded-[14px] border border-line bg-surface pr-4 pl-11 text-[15px] text-ink shadow-card placeholder:text-muted focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25 focus-visible:outline-none"
        />
      </div>
      {tab === "members" && <input type="hidden" name="type" value="members" />}
    </Form>
  );
}
