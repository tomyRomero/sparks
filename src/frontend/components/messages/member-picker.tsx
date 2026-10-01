"use client";

import { Search } from "lucide-react";
import { useId, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/api/problem";
import type { UserSummary } from "@/lib/api/types";
import { useMemberLookup } from "@/lib/queries/members";

type MemberPickerProps = {
  label: string;
  placeholder: string;
  /** Who to offer before anything is typed, such as recent conversations. */
  suggestions?: { heading: string; members: UserSummary[] | undefined };
  /** One row per member: a button, or the member with an action beside them. */
  children: (member: UserSummary) => React.ReactNode;
};

/** Finds a member by name or username, for starting a chat or sending a spark. */
export function MemberPicker({ label, placeholder, suggestions, children: row }: MemberPickerProps) {
  const id = useId();
  const [text, setText] = useState("");
  const { term, query } = useMemberLookup(text);
  const typed = text.trim().length > 0;

  let body: React.ReactNode;
  if (!typed) {
    body = suggestions ? (
      <>
        <h3 className="mb-1.5 label-mono">{suggestions.heading}</h3>
        {suggestions.members === undefined ? (
          <RowsSkeleton />
        ) : suggestions.members.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No conversations yet. Search for someone above.</p>
        ) : (
          <MemberRows members={suggestions.members} row={row} />
        )}
      </>
    ) : (
      <p className="py-6 text-center text-sm text-muted">Type a name or username.</p>
    );
  } else if (query.isError) {
    body = (
      <p role="alert" className="py-6 text-center text-sm text-danger">
        {errorMessage(query.error)}
      </p>
    );
  } else if (!query.data || term !== text.trim()) {
    // Typing, or the answer for the latest text hasn't come yet.
    body =
      query.data && query.data.items.length > 0 ? (
        <MemberRows members={query.data.items} row={row} />
      ) : (
        <RowsSkeleton />
      );
  } else if (query.data.items.length === 0) {
    body = <p className="py-6 text-center text-sm text-muted">No one matches “{term}”.</p>;
  } else {
    body = <MemberRows members={query.data.items} row={row} />;
  }

  return (
    <div className="grid gap-3">
      <div className="relative">
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          id={id}
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="h-11 w-full rounded-xl border border-line bg-canvas ps-10 pe-3.5 text-[15px] placeholder:text-muted focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25 focus-visible:outline-none"
        />
      </div>
      <div aria-live="polite" aria-busy={typed && query.isFetching}>
        {body}
      </div>
    </div>
  );
}

function MemberRows({ members, row }: { members: UserSummary[]; row: (member: UserSummary) => React.ReactNode }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {members.map((member) => (
        <li key={member.id}>{row(member)}</li>
      ))}
    </ul>
  );
}

function RowsSkeleton() {
  return (
    <div className="grid gap-2" aria-hidden>
      {[0, 1, 2].map((index) => (
        <div key={index} className="flex items-center gap-3 p-2">
          <Skeleton className="size-10 rounded-full" />
          <div className="grid flex-1 gap-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** A member as a picker shows them: picture, name and username. */
export function MemberLine({ member }: { member: UserSummary }) {
  return (
    <>
      <Avatar name={member.displayName} src={member.avatarUrl} size={40} />
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[15px] font-semibold">{member.displayName}</span>
        <span className="block truncate label-mono">@{member.username}</span>
      </span>
    </>
  );
}
