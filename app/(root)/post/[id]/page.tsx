import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs";

import Comment from "@/components/forms/Comment";
import Post from "@/components/cards/Post";

import { fetchUser } from "@/lib/actions/user.actions";
import { fetchPostById } from "@/lib/actions/post.actions";
import { updateOnlineStatus } from "@/lib/actions/chat.actions";

export const revalidate = 0;

async function page({ params }: { params: { id: string } }) {
  if (!params.id) return null;


  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

 const post = await fetchPostById(params.id);

 if(post)  console.log("POST FOUND: ", post)

const kids = post.children ? post.children : []

  return (
    <section className='relative'>
      <div>
            <Post
                key={post.idpost}
                id={post.idpost}
                currentUserId={user.id}
                parentId={post.parent_id}
                content={post.content}
                createdAt={post.created_at}
                comments={post.children}
                image={post.author.image}
                username={post.author.username}
                likes={post.likes? post.likes : ''}
                authorId={post.author_id}
                contentImage={post.image}
                title={post.title}
              />
      </div>

      <div className='mt-7'>
        <Comment
          postId={params.id}
          currentUserImg={userInfo.image}
          currentUserId={userInfo.id}
          parentId={post.parent_id}
        />
      </div>

      <div className='mt-10'>

            {kids.map((childItem: any) => (
              <Post
                key={childItem.idpost}
                id={childItem.idpost}
                currentUserId={user.id}
                parentId={childItem.parent_id}
                content={childItem.content}
                username={childItem.author_username}
                image={childItem.author_image}
                createdAt={childItem.createdAt}
                comments={childItem.children? childItem.children : null}
                likes={childItem.likes? childItem.likes : ''}
                isComment
                authorId={childItem.author_id}
                title={childItem.title}
              />
            ))}
      
      </div>
    </section>
  );
}

export default page;