import "server-only";

import { apiUrl } from "@/lib/api/config";

// Link previews: the cards a link unfolds into on LinkedIn, Slack or iMessage.
// The renderer reads inline styles only, needs flex on anything with more
// than one child, and has no CSS variables, so the dark theme is spelled out.

export const ogSize = { width: 1200, height: 630 };

export const ogColors = {
  canvas: "#070c16",
  surface: "#0e1523",
  raised: "#141d2f",
  line: "#1e2a3f",
  ink: "#e8eef8",
  inkSoft: "#c2cde0",
  muted: "#8a9ab2",
  brand: "#0060d4",
  brandBright: "#4a92ff",
  charge: "#22d3ee",
  like: "#ff4d94",
  screen: "#04070e",
};

type OgFont = { name: string; data: ArrayBuffer; weight: 500 | 700; style: "normal" };

const fonts = new Map<string, Promise<ArrayBuffer | null>>();

/**
 * One weight of a Google font as TrueType, the format the renderer reads,
 * kept for the life of the server. Null when it can't be had; the image then
 * uses the renderer's built-in font rather than failing.
 */
function googleFont(family: string, weight: number): Promise<ArrayBuffer | null> {
  const key = `${family}:${weight}`;
  let font = fonts.get(key);
  if (!font) {
    font = (async () => {
      try {
        const query = new URLSearchParams({ family: `${family}:wght@${weight}` });
        const css = await (await fetch(`https://fonts.googleapis.com/css2?${query}`, timeout())).text();
        const url = /src: url\((.+?)\) format\('(?:truetype|opentype)'\)/.exec(css)?.[1];
        if (!url) return null;
        const file = await fetch(url, timeout());
        return file.ok ? await file.arrayBuffer() : null;
      } catch {
        return null;
      }
    })();
    fonts.set(key, font);
    // A failure isn't kept, so the next image tries again.
    void font.then((data) => data ?? fonts.delete(key));
  }
  return font;
}

/** The app's display and body faces, Bricolage Grotesque and Instrument Sans. */
export async function ogFonts(): Promise<OgFont[]> {
  const [display, body] = await Promise.all([
    googleFont("Bricolage Grotesque", 700),
    googleFont("Instrument Sans", 500),
  ]);
  return [
    ...(display ? [{ name: "Bricolage", data: display, weight: 700 as const, style: "normal" as const }] : []),
    ...(body ? [{ name: "Instrument", data: body, weight: 500 as const, style: "normal" as const }] : []),
  ];
}

/**
 * A picture the API serves, as a data URL, fetched here so a slow or missing
 * one leaves the card without it instead of failing. Only PNG and JPEG: the
 * renderer can't draw WebP, and a GIF would show its first frame at best.
 */
export async function ogPicture(path: string | null): Promise<string | null> {
  const type = path && /\.(png|jpe?g)$/i.exec(path)?.[1].toLowerCase();
  if (!type) return null;
  try {
    const response = await fetch(`${apiUrl}${path}`, timeout());
    if (!response.ok) return null;
    const data = Buffer.from(await response.arrayBuffer()).toString("base64");
    return `data:image/${type === "png" ? "png" : "jpeg"};base64,${data}`;
  } catch {
    return null;
  }
}

function timeout(): RequestInit {
  return { signal: AbortSignal.timeout(4000) };
}

/** The bolt in its blue square, as app/icon.svg draws it. */
export function OgMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect width="32" height="32" rx="8" fill={ogColors.brand} />
      <path
        transform="translate(6 6) scale(0.8333)"
        d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z"
        fill="#fff"
        stroke="#fff"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The dark ground every preview sits on, with the brand's blue and cyan glows. */
export function OgFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "56px 64px",
        color: ogColors.ink,
        fontFamily: "Instrument",
        backgroundColor: ogColors.canvas,
        backgroundImage: [
          "radial-gradient(60% 80% at 0% 0%, rgba(0, 96, 212, 0.35), transparent)",
          "radial-gradient(50% 70% at 100% 100%, rgba(34, 211, 238, 0.18), transparent)",
        ].join(", "),
      }}
    >
      {children}
    </div>
  );
}
