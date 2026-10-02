"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import type { Theme } from "@/lib/preferences";
import { ThemeProvider, useTheme } from "@/lib/theme";

export function Providers({ theme, children }: { theme: Theme; children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Pages arrive with server data; don't refetch it on mount.
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <ThemeProvider initial={theme}>
      <QueryClientProvider client={queryClient}>
        <Tooltip.Provider delayDuration={300}>{children}</Tooltip.Provider>
        <Toasts />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

function Toasts() {
  const { theme } = useTheme();
  return <Toaster position="bottom-center" theme={theme} toastOptions={{ className: "font-sans" }} />;
}
