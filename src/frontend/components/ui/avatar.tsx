import Image from "next/image";
import { cn } from "@/lib/utils";

type AvatarProps = {
  name: string;
  src: string | null;
  size?: number;
  /** Shows the green dot when true. Left out where presence isn't shown. */
  online?: boolean;
  className?: string;
};

/** Dark enough for white initials (4.5:1), picked by name so it's stable. */
const tones = ["#3b5bdb", "#7048e8", "#2b7a3b", "#0b7285", "#c2255c", "#1864ab", "#495867", "#9c36b5"];

export function Avatar({ name, src, size = 40, online, className }: AvatarProps) {
  const style = { width: size, height: size };
  const face = src ? (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0 rounded-full bg-raised object-cover", className)}
      style={style}
    />
  ) : (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-white",
        className,
      )}
      style={{ ...style, fontSize: size * 0.38, backgroundColor: tones[hash(name) % tones.length] }}
    >
      {initials(name)}
    </span>
  );

  if (!online) return face;
  const dot = Math.max(10, Math.round(size * 0.28));
  return (
    <span className="relative inline-flex shrink-0">
      {face}
      <span
        aria-hidden
        className="absolute -right-px -bottom-px rounded-full border-2 border-surface bg-online"
        style={{ width: dot, height: dot }}
      />
    </span>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts.at(-1)![0] : "")).toUpperCase() || "?";
}

function hash(text: string) {
  let value = 0;
  for (const char of text) value = (value * 31 + char.charCodeAt(0)) >>> 0;
  return value;
}
