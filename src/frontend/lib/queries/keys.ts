// Every key holding sparks starts with "posts" (comments with "comments"),
// so one cache update reaches every list that shows the item.
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
  /** A quick lookup for pickers (one page, not a paged list). */
  memberLookup: (q: string) => ["member-lookup", q] as const,
  /** The viewer's own sparks or liked ones, one page, for sharing into a chat. */
  sparkPicker: (username: string, list: "posts" | "liked") => ["posts", "picker", username, list] as const,
  /** Usernames compare without case, as the API does. */
  usernameFree: (username: string) => ["username-free", username.toLowerCase()] as const,

  /** Everything under "presence" is patched by live PresenceChanged events. */
  presence: ["presence"] as const,
  presenceOf: (userIds: number[]) => ["presence", "of", userIds] as const,
  presenceAround: ["presence", "around"] as const,

  activity: ["activity"] as const,
  inbox: ["inbox"] as const,
  /** The latest few conversations, one page, for "send to"; refreshed with the inbox. */
  recentConversations: ["inbox", "recent"] as const,
  conversation: (id: number) => ["conversation", id] as const,
  messages: (conversationId: number) => ["messages", conversationId] as const,
};
