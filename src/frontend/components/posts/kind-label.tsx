import { Zap } from "lucide-react";
import type { SparkKind } from "@/lib/api/types";
import { kindInfo } from "@/lib/kinds";

/** The kind of a spark as a mono label, with the bolt when AI drafted it. */
export function KindLabel({ kind, aiPrompt }: { kind: SparkKind; aiPrompt: string | null }) {
  const { label, icon: Icon } = kindInfo(kind);
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex items-center gap-1 label-mono">
        <Icon className="size-3.5" aria-hidden />
        {label.toLowerCase()}
      </span>
      {aiPrompt && (
        <span
          className="inline-flex items-center gap-1 rounded-sm bg-charge-soft px-1.5 py-0.5 font-mono text-[10px] text-charge"
          title={`Drafted with AI from: ${aiPrompt}`}
        >
          <Zap className="size-3 fill-current" aria-hidden />
          ai draft
        </span>
      )}
    </span>
  );
}
