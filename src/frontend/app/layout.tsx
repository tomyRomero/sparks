import type { Metadata, Viewport } from "next";
import { Agbalumo, Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const instrumentSans = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument-sans" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });
// The wordmark only; not a variable font, so its one weight is named.
const agbalumo = Agbalumo({ subsets: ["latin"], weight: "400", variable: "--font-agbalumo" });

export const metadata: Metadata = {
  title: { default: "Sparks", template: "%s · Sparks" },
  description: "Share short creative sparks, write them with AI, and talk them over.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7fc" },
    { media: "(prefers-color-scheme: dark)", color: "#080d17" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${bricolage.variable} ${jetbrainsMono.variable} ${agbalumo.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
