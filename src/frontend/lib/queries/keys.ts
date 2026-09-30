/** TanStack Query keys, in one place so invalidations can't drift from queries. */
export const queryKeys = {
  unreadActivity: ["unread", "activity"] as const,
  unreadMessages: ["unread", "messages"] as const,
  feed: (filter: { kind?: string; q?: string }) => ["feed", filter] as const,
  profilePosts: (username: string, tab: string) => ["profile", username, tab] as const,
  thread: (postId: number) => ["thread", postId] as const,
  replies: (commentId: number) => ["replies", commentId] as const,
  activity: ["activity"] as const,
  inbox: ["inbox"] as const,
  messages: (conversationId: number) => ["messages", conversationId] as const,
};
