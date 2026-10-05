"use client";

import { ThemeSwitch } from "@/components/shell/theme-switch";

export function AppearanceSection() {
  return (
    <section
      aria-labelledby="appearance-heading"
      className="mt-4 grid gap-3 rounded-[18px] border border-line bg-surface p-4 shadow-card sm:p-6"
    >
      <h2 id="appearance-heading" className="font-display text-lg font-semibold">
        Appearance
      </h2>
      <p className="text-sm text-muted">System follows your device&apos;s light or dark setting.</p>
      <ThemeSwitch withLabels className="w-full max-w-sm" />
    </section>
  );
}
