import { redirect } from "next/navigation";

import { fetchLikedPostsByUser } from "@/lib/actions/user.actions";

import Post from "../cards/Post";

interface Props {
  currentUserId: string;
  accountId: string;
}

async function LikedTab({ currentUserId, accountId }: Props) {
 

 const result = await fetchLikedPostsByUser(accountId);
  

  if (!result) {
    redirect("/");
  }

  return (
    <section className='mt-9 flex flex-col gap-10'>
        
      {
      //@ts-ignore
      result?.map((post) => (
        <Post
        key={post.idpost}
        id={post.idpost}
        currentUserId={currentUserId}
        parentId={post.parent_Id}
        content={post.content}
        createdAt={post.created_at}
        comments={post.children}
        image={post.author_image}
        contentImage={post.image}
        username={post.author_username}
        likes = {post.likes? post.likes: ''}
        authorId = {post.author_id}
        title={post.title}
      />
      ))}
    </section>
  );
}

export default LikedTab;