/**
 * TanStack Query keys, in one place so invalidations can't drift from queries.
 * Everything holding sparks starts with "posts" and everything holding
 * comments with "comments", so a change to one item can reach every list and
 * page that shows it.
 */
export const queryKeys = {
  unreadActivity: ["unread", "activity"] as const,
  unreadMessages: ["unread", "messages"] as const,

  posts: ["posts"] as const,
  post: (id: number) => ["posts", "detail", id] as const,
  feed: (filter: { kind?: string; q?: string }) => ["posts", "feed", filter] as const,
  profilePosts: (username: string, tab: "posts" | "liked") => ["posts", "profile", username, tab] as const,

  comments: ["comments"] as const,
  comment: (id: number) => ["comments", "detail", id] as const,
  thread: (postId: number) => ["comments", "thread", postId] as const,
  replies: (commentId: number) => ["comments", "replies", commentId] as const,
  profileComments: (username: string) => ["comments", "profile", username] as const,

  members: (q: string) => ["members", q] as const,
  /** Usernames compare without case, as the API does. */
  usernameFree: (username: string) => ["username-free", username.toLowerCase()] as const,

  activity: ["activity"] as const,
  inbox: ["inbox"] as const,
  conversation: (id: number) => ["conversation", id] as const,
  messages: (conversationId: number) => ["messages", conversationId] as const,
};
