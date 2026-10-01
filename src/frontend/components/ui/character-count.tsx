import { cn } from "@/lib/utils";

type CharacterCountProps = {
  length: number;
  max: number;
  /** Stay hidden until the text is this long; long fields only need it near the end. */
  showFrom?: number;
  className?: string;
};

/** Amber in the last tenth, red at the limit; announced once it turns amber. */
export function CharacterCount({ length, max, showFrom = 0, className }: CharacterCountProps) {
  const near = length >= max * 0.9;
  return (
    <>
      {length >= showFrom && (
        <span
          aria-hidden
          className={cn(
            "font-mono text-xs text-muted tabular-nums",
            near && "text-warn",
            length >= max && "text-danger",
            className,
          )}
        >
          {length.toLocaleString("en-US")} / {max.toLocaleString("en-US")}
        </span>
      )}
      <span aria-live="polite" className="sr-only">
        {near ? `${(max - length).toLocaleString("en-US")} characters left` : ""}
      </span>
    </>
  );
}
