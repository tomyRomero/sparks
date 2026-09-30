import { CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/** A form-level message: an error the fields can't show, or a confirmation. */
export function FormMessage({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  const Icon = tone === "error" ? CircleAlert : CircleCheck;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-md px-3 py-2.5 text-sm",
        tone === "error" ? "bg-danger-soft text-danger" : "bg-brand-soft text-brand",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
