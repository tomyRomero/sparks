
import { fetchUserComments } from "@/lib/actions/user.actions";
import Link from "next/link";
import CommentActivity from "./CommentActivity";
import { getImageData } from "@/lib/s3";

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
    <section className='mt-9 flex flex-col gap-8'>
        {noResults && (
            <h2 className=" text-center text-primary-500">No Results</h2>
        )}
      {
      //@ts-ignore
      result?.map((comment) => (
      <CommentActivity 
        parent_Id={comment.parent_id}
        image={comment.author_image}
        author_username={comment.author_username}
        created_at={comment.created_at}
        content={comment.content}
      />
      ))}
    </section>
  );
}

export default CommentsTab;