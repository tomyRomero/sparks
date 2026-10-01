"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useId } from "react";
import type { Theme } from "@/lib/preferences";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const options: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

/** Radio buttons, so arrow keys move between the three. */
export function ThemeSwitch({ withLabels = false, className }: { withLabels?: boolean; className?: string }) {
  const { theme, setTheme } = useTheme();
  const name = useId();
  return (
    <fieldset className={cn("inline-flex rounded-full border border-line bg-canvas p-[3px]", className)}>
      <legend className="sr-only">Theme</legend>
      {options.map(({ value, label, icon: Icon }) => (
        <label
          key={value}
          title={withLabels ? undefined : label}
          className={cn(
            "inline-flex h-8 items-center justify-center gap-1.5 rounded-full text-muted transition-colors hover:text-ink",
            "has-checked:bg-surface has-checked:text-ink has-checked:shadow-[0_1px_3px_var(--shadow-far)]",
            "has-focus-visible:ring-focus has-focus-visible:ring-2",
            withLabels ? "flex-1 px-3 text-sm font-medium" : "w-9",
          )}
        >
          <input
            type="radio"
            name={name}
            value={value}
            checked={theme === value}
            onChange={() => setTheme(value)}
            className="sr-only"
          />
          <Icon className="size-4" aria-hidden />
          <span className={withLabels ? undefined : "sr-only"}>{label}</span>
        </label>
      ))}
    </fieldset>
  );
}
