import Image from "next/image";
import { cn } from "@/lib/utils";

type AvatarProps = {
  name: string;
  src: string | null;
  size?: number;
  className?: string;
};

/** A member's picture, or their initials on a tinted disc when they have none. */
export function Avatar({ name, src, size = 40, className }: AvatarProps) {
  const style = { width: size, height: size };
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        className={cn("shrink-0 rounded-full bg-raised object-cover", className)}
        style={style}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-brand-soft font-display font-semibold text-brand",
        className,
      )}
      style={{ ...style, fontSize: size * 0.4 }}
    >
      {initials(name)}
    </span>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts.at(-1)![0] : "")).toUpperCase() || "?";
}
