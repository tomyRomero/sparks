// Every key holding sparks starts with "posts" (comments with "comments"),
// so one cache update reaches every list that shows the item.
export const queryKeys = {
  unreadActivity: ["unread", "activity"] as const,
  unreadMessages: ["unread", "messages"] as const,

  posts: ["posts"] as const,
  post: (id: number) => ["posts", "detail", id] as const,
  /** The home feed's filter, or a search's term and kinds. */
  feed: (filter: { kinds?: readonly string[]; sort?: string; pictures?: boolean; following?: boolean; q?: string }) =>
    ["posts", "feed", filter] as const,
  /** The week's most liked sparks, for the right rail. */
  trending: ["posts", "trending"] as const,
  profilePosts: (username: string, tab: "posts" | "pictures" | "liked") => ["posts", "profile", username, tab] as const,

  comments: ["comments"] as const,
  comment: (id: number) => ["comments", "detail", id] as const,
  thread: (postId: number) => ["comments", "thread", postId] as const,
  replies: (commentId: number) => ["comments", "replies", commentId] as const,
  profileComments: (username: string) => ["comments", "profile", username] as const,

  members: (q: string) => ["members", q] as const,
  /** Everything under "people" lists members with a follow button. */
  people: ["people"] as const,
  followList: (username: string, list: "followers" | "following") => ["people", list, username] as const,
  suggestions: ["people", "suggestions"] as const,
  searchCounts: (q: string) => ["search-counts", q] as const,
  /** A quick lookup for pickers (one page, not a paged list). */
  memberLookup: (q: string) => ["member-lookup", q] as const,
  /** The viewer's own sparks or liked ones, one page, for sharing into a chat. */
  sparkPicker: (username: string, list: "posts" | "liked") => ["posts", "picker", username, list] as const,
  /** Usernames compare without case, as the API does. */
  usernameFree: (username: string) => ["username-free", username.toLowerCase()] as const,

  /** Everything under "presence" is patched by live PresenceChanged events. */
  presence: ["presence"] as const,
  /** Every presenceOf entry, whatever members it asked about. */
  presenceLists: ["presence", "of"] as const,
  presenceOf: (userIds: number[]) => ["presence", "of", userIds] as const,
  presenceAround: ["presence", "around"] as const,

  activity: ["activity"] as const,
  activityList: (filter: string | undefined) => ["activity", filter ?? "all"] as const,
  inbox: ["inbox"] as const,
  /** The latest few conversations, one page, for "send to"; refreshed with the inbox. */
  recentConversations: ["inbox", "recent"] as const,
  conversation: (id: number) => ["conversation", id] as const,
  allMessages: ["messages"] as const,
  messages: (conversationId: number) => ["messages", conversationId] as const,
};
