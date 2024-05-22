import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs";

import Comment from "@/components/forms/Comment";
import Post from "@/components/cards/Post";

import { fetchUser } from "@/lib/actions/user.actions";
import { fetchPostById } from "@/lib/actions/post.actions";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const revalidate = 0;

async function page({ params }: { params: { id: string } }) {
  if (!params.id) return null;
  

  const user = await currentUser();
  if (!user) redirect('/');

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

 const post = await fetchPostById(params.id);



  if(!post)
  {
    return(
      <section className="pt-16 flex flex-col justify-center items-center">
      <div className="mb-8">
        <Image src={"/assets/error.jpg"} alt="Error" width={300} height={300} className="rounded-xl"/>
      </div>
      <h1 className="text-heading3-bold mb-4">Post Not Found</h1>
      <p className="text-body-bold text-gray-600 mb-8">The post you are looking for does not exist or was deleted.</p>
      <Link href={"/"}>
        <Button className="bg-primary-500 hover:bg-cyan-400 hover:text-black">
          Home
        </Button>
      </Link>
    </section>
    
    )
  }

  if(post)
  {
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
                prompt={post.prompt}
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
                prompt={childItem.prompt}
              />
            ))}
      
      </div>
    </section>
  );
}
}

export default page;