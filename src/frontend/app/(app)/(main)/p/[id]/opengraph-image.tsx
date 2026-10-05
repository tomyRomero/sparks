import { ImageResponse } from "next/og";
import { apiUrl } from "@/lib/api/config";
import type { Post } from "@/lib/api/types";
import { isId } from "@/lib/ids";
import { kindInfo } from "@/lib/kinds";
import { OgFrame, OgMark, ogColors, ogFonts, ogPicture, ogSize } from "@/lib/og";
import { haikuLines, sparkPreview, splitSpark } from "@/lib/spark-text";
import { excerpt } from "@/lib/text";

const contentType = "image/png";

// The frame's 1200px less its 64px sides, and less the picture and gap beside it.
const PICTURE = 340;
const TEXT_ALONE = 1072;
const TEXT_BESIDE_PICTURE = TEXT_ALONE - PICTURE - 48;

/** Public, and edits are rare: a few minutes' cache keeps crawlers from asking the API each time. */
async function getPost(id: string): Promise<Post | null> {
  if (!isId(id)) return null;
  try {
    const response = await fetch(`${apiUrl}/api/v1/posts/${id}`, { next: { revalidate: 300 } });
    return response.ok ? ((await response.json()) as Post) : null;
  } catch {
    return null;
  }
}

export async function generateImageMetadata({ params }: { params: { id: string } }) {
  const post = await getPost(params.id);
  const alt = post
    ? `${kindInfo(post.kind).label} by ${post.author.displayName}: “${sparkPreview(post.kind, post.body, 120)}”`
    : "Sparks, a place for short creative sparks";
  return [{ id: "card", alt, size: ogSize, contentType }];
}

/** A spark as its link preview: its words laid out by kind, its picture, and who wrote it. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const post = await getPost((await params).id);
  const [fonts, picture, avatar] = await Promise.all([
    ogFonts(),
    ogPicture(post?.imageUrl ?? null),
    ogPicture(post?.author.avatarUrl ?? null),
  ]);

  return new ImageResponse(
    <OgFrame>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <OgMark size={48} />
          <span style={{ fontFamily: "Bricolage", fontSize: 36 }}>Sparks</span>
        </div>
        {post && (
          <span
            style={{
              display: "flex",
              padding: "8px 20px",
              borderRadius: 999,
              border: `2px solid ${ogColors.line}`,
              backgroundColor: ogColors.surface,
              color: ogColors.inkSoft,
              fontSize: 24,
            }}
          >
            {kindInfo(post.kind).label}
          </span>
        )}
      </div>

      <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 48, paddingTop: 28, paddingBottom: 28 }}>
        {post ? (
          <>
            <Words post={post} compact={picture !== null} />
            {picture && (
              <img
                src={picture}
                alt=""
                width={PICTURE}
                height={PICTURE}
                style={{ borderRadius: 28, objectFit: "cover", border: `2px solid ${ogColors.line}` }}
              />
            )}
          </>
        ) : (
          <span style={{ fontFamily: "Bricolage", fontSize: 64, lineHeight: 1.1 }}>
            Short creative sparks, written with a little help.
          </span>
        )}
      </div>

      {post && (
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {avatar ? (
            <img src={avatar} alt="" width={64} height={64} style={{ borderRadius: 999, objectFit: "cover" }} />
          ) : (
            <span
              style={{
                display: "flex",
                width: 64,
                height: 64,
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: ogColors.brand,
                fontFamily: "Bricolage",
                fontSize: 28,
              }}
            >
              {post.author.displayName.trim().charAt(0).toUpperCase()}
            </span>
          )}
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <span style={{ fontFamily: "Bricolage", fontSize: 30 }}>{post.author.displayName}</span>
            <span style={{ fontSize: 24, color: ogColors.muted }}>@{post.author.username}</span>
          </div>
          <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 28, color: ogColors.inkSoft }}>
            <svg width="30" height="30" viewBox="0 0 24 24">
              <path
                d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
                fill={ogColors.like}
              />
            </svg>
            {post.likeCount}
          </span>
        </div>
      )}
    </OgFrame>,
    { ...ogSize, fonts },
  );
}

/** The spark's words, set the way its card sets them. */
function Words({ post, compact }: { post: Post; compact: boolean }) {
  const { title, text } = splitSpark(post.kind, post.body);
  // A set width: the renderer sizes a growing flex item by its narrowest wrap.
  const column = {
    display: "flex",
    flexDirection: "column" as const,
    width: compact ? TEXT_BESIDE_PICTURE : TEXT_ALONE,
    gap: 18,
  };

  if (post.kind === "haiku") {
    return (
      <div style={column}>
        {haikuLines(post.body)
          .slice(0, 3)
          .map((line, index) => (
            <span
              key={index}
              style={{ fontFamily: "Bricolage", fontSize: compact ? 44 : 54, paddingLeft: index === 1 ? 48 : 0 }}
            >
              {excerpt(line, 40)}
            </span>
          ))}
      </div>
    );
  }

  if (post.kind === "quote" || post.kind === "aphorism") {
    return (
      <div style={column}>
        {post.kind === "quote" && (
          <span
            style={{
              display: "flex",
              height: 64,
              fontFamily: "Bricolage",
              fontSize: 120,
              lineHeight: 1,
              color: ogColors.brandBright,
            }}
          >
            “
          </span>
        )}
        <span style={{ fontFamily: "Bricolage", fontSize: compact ? 48 : 60, lineHeight: 1.12 }}>
          {excerpt(text, compact ? 110 : 150)}
        </span>
      </div>
    );
  }

  return (
    <div style={column}>
      {title && (
        <span style={{ fontFamily: "Bricolage", fontSize: compact ? 54 : 64, lineHeight: 1.05 }}>
          {excerpt(title, 60)}
        </span>
      )}
      <span
        style={{
          fontSize: title ? 28 : compact ? 34 : 40,
          lineHeight: 1.4,
          color: title ? ogColors.inkSoft : ogColors.ink,
        }}
      >
        {excerpt(text, title ? 170 : compact ? 160 : 210)}
      </span>
      {post.kind === "joke" && (
        <span style={{ display: "flex", fontSize: 24, color: ogColors.charge }}>Open it to reveal the punchline</span>
      )}
    </div>
  );
}
