import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Agbalumo, Bricolage_Grotesque, Courier_Prime, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { THEME_COOKIE, toTheme } from "@/lib/preferences";
import { Providers } from "./providers";
import "./globals.css";

const instrumentSans = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument-sans" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });
// The wordmark only; not a variable font, so its one weight is named.
const agbalumo = Agbalumo({ subsets: ["latin"], weight: "400", variable: "--font-agbalumo" });
// Movie scripts only, so it isn't preloaded on every page.
const courierPrime = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-courier-prime",
  preload: false,
});

export const metadata: Metadata = {
  title: { default: "Sparks", template: "%s · Sparks" },
  description: "Share short creative sparks, write them with AI, and talk them over.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f5fb" },
    { media: "(prefers-color-scheme: dark)", color: "#070c16" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = toTheme((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <html
      lang="en"
      data-theme={theme === "system" ? undefined : theme}
      className={`${instrumentSans.variable} ${bricolage.variable} ${jetbrainsMono.variable} ${agbalumo.variable} ${courierPrime.variable}`}
    >
      <body>
        <Providers theme={theme}>{children}</Providers>
      </body>
    </html>
  );
}
