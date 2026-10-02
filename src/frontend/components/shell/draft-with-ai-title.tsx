import { Zap } from "lucide-react";

/** The heading of the right rail's AI card, for members and guests alike. */
export function DraftWithAiTitle({ id }: { id?: string }) {
  return (
    <h2 id={id} className="flex items-center gap-2.5 font-display text-lg font-bold">
      <span className="inline-flex size-[30px] items-center justify-center rounded-[9px] bg-charge-soft text-charge">
        <Zap className="size-4 fill-current" aria-hidden />
      </span>
      Draft with AI
    </h2>
  );
}
