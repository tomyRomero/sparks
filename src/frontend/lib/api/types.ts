// Mirrors the API's JSON: camelCase, enums as names, ISO dates.

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
  /** The most-liked comment on the spark itself, for a preview in lists. */
  topComment: CommentPreview | null;
};

export type CommentPreview = { id: number; body: string; author: UserSummary };

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
  /** Empty when the message only shares a spark. */
  body: string;
  /** The spark the message shares. An empty body with none means the spark was deleted. */
  sharedPost: SharedSpark | null;
  createdAt: string;
  readAt: string | null;
};

export type SharedSpark = {
  id: number;
  kind: SparkKind;
  body: string;
  imageUrl: string | null;
  author: UserSummary;
  createdAt: string;
};

/** Pushed live when the other participant reads the member's messages up to a point. */
export type MessagesReadEvent = {
  conversationId: number;
  readerId: number;
  upToMessageId: number;
  readAt: string;
};

export type TypingEvent = { conversationId: number; userId: number };

/** Whether a member is online; also pushed live (PresenceChanged) when it changes. */
export type Presence = { userId: number; online: boolean; lastSeenAt: string | null };

/** GET /presence/around: members who are around, online first. */
export type MemberPresence = { user: UserSummary; online: boolean; lastSeenAt: string | null };

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

/** GET /search/counts: how many of each a search finds. */
export type SearchCounts = { sparks: number; members: number };

/** GET /auth/username-available: whether a sign-up could take this name. */
export type UsernameAvailability = { username: string; available: boolean };
