import { Search } from "lucide-react";
import Form from "next/form";

/**
 * The search box. A GET form, so it works before any script loads; once
 * the app is running, Next turns the submit into a client-side navigation.
 */
export function SearchForm({ q, tab }: { q: string; tab: "sparks" | "members" }) {
  return (
    <Form action="/search" role="search" className="border-b border-line px-4 py-4 sm:px-6">
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
          className="h-11 w-full rounded-full border border-line bg-surface pr-4 pl-11 text-ink placeholder:text-muted focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25 focus-visible:outline-none"
        />
      </div>
      {tab === "members" && <input type="hidden" name="type" value="members" />}
    </Form>
  );
}
