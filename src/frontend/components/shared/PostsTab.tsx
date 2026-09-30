import { redirect } from "next/navigation";

import { fetchUserPosts } from "@/lib/actions/user.actions";

import PostsPage from "../PostsPage";

interface Props {
  currentUserId: string;
  accountId: string;
}

async function PostsTab({ currentUserId, accountId}: Props) {
 

 const results = await fetchUserPosts(accountId);

  return (
   <PostsPage posts={results} currentUserId={currentUserId} />
  );
}

export default PostsTab;