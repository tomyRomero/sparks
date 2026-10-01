import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import type { SharedSpark } from "@/lib/api/types";
import { kindInfo } from "@/lib/kinds";
import { splitSpark } from "@/lib/spark-text";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";

type SharedSparkCardProps = {
  spark: SharedSpark;
  /** Sent by the viewer: outlined in brand blue, with its corner on the right. */
  mine: boolean;
  className?: string;
};

/**
 * A spark shared in a chat: who wrote it, its picture and opening, and the
 * way to it. A joke shows only its setup, so the punchline still lands.
 */
export function SharedSparkCard({ spark, mine, className }: SharedSparkCardProps) {
  const { title, text } = splitSpark(spark.kind, spark.body);
  const { label, icon: Icon } = kindInfo(spark.kind);
  return (
    <Link
      href={`/p/${spark.id}`}
      className={cn(
        "flex w-[380px] max-w-full flex-col gap-2.5 rounded-[20px] bg-surface p-3.5 text-ink transition-colors",
        mine
          ? "rounded-br-md border-[1.5px] border-brand hover:bg-brand-soft/40"
          : "rounded-bl-md border border-line hover:border-line-strong",
        className,
      )}
    >
      <span className="flex items-center gap-2.5">
        <Avatar name={spark.author.displayName} src={spark.author.avatarUrl} size={28} />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{spark.author.displayName}</span>
        <span className="inline-flex shrink-0 items-center gap-1 label-mono">
          <Icon className="size-3.5" aria-hidden />
          {label} ·{" "}
          <time dateTime={spark.createdAt} suppressHydrationWarning>
            {timeAgo(spark.createdAt)}
          </time>
        </span>
      </span>
      {spark.imageUrl && (
        <span className="relative block aspect-[16/9] overflow-hidden rounded-xl bg-raised">
          <Image src={spark.imageUrl} alt="" fill sizes="380px" className="object-cover" />
        </span>
      )}
      {title && <span className="font-display text-base leading-snug font-semibold">{title}</span>}
      {text && <span className="line-clamp-4 text-[14.5px] leading-relaxed whitespace-pre-line">{text}</span>}
      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand">
        Open spark
        <ArrowRight className="size-3.5" aria-hidden />
      </span>
    </Link>
  );
}
