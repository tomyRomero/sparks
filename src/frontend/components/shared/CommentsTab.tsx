
import { fetchUserComments } from "@/lib/actions/user.actions";
import Link from "next/link";
import CommentActivity from "./CommentActivity";
import { getImageData } from "@/lib/s3";
import CommentPage from "../CommentPage";

interface Props {
  currentUserId: string;
  accountId: string;
}

async function CommentsTab({ currentUserId, accountId }: Props) {
 

 const result = await fetchUserComments(accountId);
  
 let noResults = false

  if (!result) {
   noResults = true
  }

  console.log("Result For Comments: ", result)

  return (
   <CommentPage comments={result}/>
  );
}

export default CommentsTab;