import { ImageResponse } from "next/og";
import { kinds } from "@/lib/kinds";
import { OgFrame, OgMark, ogColors, ogFonts, ogSize } from "@/lib/og";

export const alt = "Sparks: share short creative sparks, write them with AI, and talk them over";
export const size = ogSize;
export const contentType = "image/png";

/** The preview for any page without its own: the home feed, search, a profile. */
export default async function Image() {
  return new ImageResponse(
    <OgFrame>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <OgMark size={72} />
        <span style={{ fontFamily: "Bricolage", fontSize: 64 }}>Sparks</span>
      </div>
      <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center", gap: 24 }}>
        <span style={{ fontFamily: "Bricolage", fontSize: 72, lineHeight: 1.05 }}>
          Short creative sparks, written with a little help.
        </span>
        <span style={{ fontSize: 32, color: ogColors.inkSoft }}>
          Movie pitches, book plots, haiku and art, with AI drafts and pictures to match.
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {kinds.map(({ kind, label }) => (
          <span
            key={kind}
            style={{
              display: "flex",
              padding: "8px 18px",
              borderRadius: 999,
              border: `2px solid ${ogColors.line}`,
              backgroundColor: ogColors.surface,
              color: ogColors.inkSoft,
              fontSize: 22,
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </OgFrame>,
    { ...size, fonts: await ogFonts() },
  );
}
