/**
 * The API's response and request shapes, as it serialises them (camelCase,
 * enums as camelCase names, dates as ISO strings). Kept in step with the
 * C# records in src/backend.
 */

export type SparkKind =
  | "regular"
  | "movieScript"
  | "bookPlot"
  | "artwork"
  | "fashion"
  | "photography"
  | "haiku"
  | "quote"
  | "joke"
  | "aphorism";

export type UserSummary = {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type CurrentUser = {
  id: number;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
};

export type Post = {
  id: number;
  kind: SparkKind;
  body: string;
  imageUrl: string | null;
  aiPrompt: string | null;
  createdAt: string;
  editedAt: string | null;
  author: UserSummary;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
};

export type Comment = {
  id: number;
  postId: number;
  parentCommentId: number | null;
  body: string;
  createdAt: string;
  editedAt: string | null;
  author: UserSummary;
  likeCount: number;
  replyCount: number;
  likedByMe: boolean;
};

export type LikeState = { liked: boolean; likeCount: number };

/** A page of a list ordered by id; pass nextCursor back as `cursor`. */
export type CursorPage<T> = { items: T[]; nextCursor: number | null };

/** A page of a list with an opaque cursor (activity, the inbox). */
export type OpaquePage<T> = { items: T[]; nextCursor: string | null };

export type Profile = {
  id: number;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  joinedAt: string;
  postCount: number;
  likesReceived: number;
};

export type ActivityKind = "postLike" | "commentLike" | "comment" | "reply";

export type ActivityItem = {
  kind: ActivityKind;
  at: string;
  actor: UserSummary;
  postId: number;
  commentId: number | null;
  excerpt: string;
  unread: boolean;
};

export type Message = {
  id: number;
  conversationId: number;
  senderId: number;
  body: string;
  createdAt: string;
  readAt: string | null;
};

/** Pushed live when the other participant reads the member's messages up to a point. */
export type MessagesReadEvent = {
  conversationId: number;
  readerId: number;
  upToMessageId: number;
  readAt: string;
};

/** Pushed live while the other participant types. */
export type TypingEvent = { conversationId: number; userId: number };

export type Conversation = {
  id: number;
  with: UserSummary;
  lastMessage: Message | null;
  unreadCount: number;
  lastMessageAt: string;
};

export type UploadedImage = { key: string; url: string };

export type Draft = { body: string; imagePrompt: string | null };

export type UnreadCount = { count: number };

/** GET /auth/username-available: whether a sign-up could take this name. */
export type UsernameAvailability = { username: string; available: boolean };
