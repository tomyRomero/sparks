import { redirect } from "next/navigation";

import { fetchLikedPostsByUser } from "@/lib/actions/user.actions";

import Post from "../cards/Post";
import LikedPage from "../LikedPage";

interface Props {
  currentUserId: string;
  accountId: string;
}

async function LikedTab({ currentUserId, accountId }: Props) {
 

 const result = await fetchLikedPostsByUser(accountId);

  return (
   <LikedPage posts={result} currentUserId={currentUserId}/>
  );
}

export default LikedTab;