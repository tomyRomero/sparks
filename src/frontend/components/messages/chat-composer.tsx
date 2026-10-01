"use client";

import { SendHorizontal, Zap } from "lucide-react";
import { useRef, useState } from "react";
import { CharacterCount } from "@/components/ui/character-count";
import { Hint } from "@/components/ui/hint";
import { Textarea } from "@/components/ui/input";
import type { Post } from "@/lib/api/types";
import { limits } from "@/lib/limits";
import { SparkPicker } from "./spark-picker";

/** How often the member's typing is signalled while they type. */
const TYPING_SIGNAL_MS = 3000;

type ChatComposerProps = {
  name: string;
  username: string;
  onSend: (body: string) => void;
  onShare: (post: Post) => void;
  onTyping: () => void;
};

/** The message box: Enter sends, Shift+Enter starts a new line, and the bolt shares a spark. */
export function ChatComposer({ name, username, onSend, onShare, onTyping }: ChatComposerProps) {
  const [text, setText] = useState("");
  const [picking, setPicking] = useState(false);
  const lastSignal = useRef(0);
  const firstName = name.split(/\s+/)[0];

  function send() {
    const body = text.trim();
    if (!body) return;
    onSend(body);
    setText("");
  }

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
        className="flex items-end gap-2.5 border-t border-line bg-surface px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-4"
      >
        <Hint label="Share a spark" side="top">
          <button
            type="button"
            onClick={() => setPicking(true)}
            aria-label="Share a spark"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-charge-soft text-charge transition-colors hover:bg-charge hover:text-brand-ink"
          >
            <Zap className="size-[18px] fill-current" aria-hidden />
          </button>
        </Hint>
        <div className="relative min-w-0 flex-1">
          <CharacterCount
            length={text.length}
            max={limits.messageBodyMax}
            showFrom={limits.messageBodyMax * 0.9}
            className="absolute -top-5 right-3"
          />
          <Textarea
            aria-label={`Message ${name}`}
            placeholder={`Message ${firstName}`}
            rows={1}
            value={text}
            maxLength={limits.messageBodyMax}
            onChange={(event) => {
              setText(event.target.value);
              if (Date.now() - lastSignal.current > TYPING_SIGNAL_MS) {
                lastSignal.current = Date.now();
                onTyping();
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                send();
              }
            }}
            className="block [field-sizing:content] max-h-40 min-h-11 resize-none rounded-[22px] bg-canvas px-5 py-2.5 text-[15px]"
          />
        </div>
        <button
          type="submit"
          disabled={!text.trim()}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-brand text-brand-ink transition-colors hover:bg-brand-hover disabled:opacity-50"
        >
          <SendHorizontal className="size-[18px]" aria-hidden />
          <span className="sr-only">Send</span>
        </button>
      </form>
      {/* Outside the form, so nothing in the dialog can submit it. */}
      <SparkPicker
        open={picking}
        onOpenChange={setPicking}
        username={username}
        recipient={firstName}
        onPick={onShare}
      />
    </>
  );
}
