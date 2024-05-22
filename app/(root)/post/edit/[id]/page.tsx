import React from 'react'
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs";
import { fetchUser } from "@/lib/actions/user.actions";
import { fetchPostById } from "@/lib/actions/post.actions";
import Image from "next/image";
import Link from "next/link";
import EditPost from '@/components/cards/EditPost';

const page = async ({ params }: { params: { id: string } }) => {

    if (!params.id) return null;

    const user = await currentUser();
    if (!user) redirect('/');
  
    const userInfo = await fetchUser(user.id);
    if (!userInfo?.onboarded) redirect("/onboarding");
  
   const post = await fetchPostById(params.id);

   if(user.id !== post.author_id)
   {
      redirect("/")
   }
  
   if(!post)
   {
     return(
       <section className="pt-16 flex flex-col justify-center items-center">
       <div className="mb-8">
         <Image src={"/assets/error.jpg"} alt="Error" width={300} height={300} className="rounded-xl"/>
       </div>
       <h1 className="text-heading3-bold mb-4">Post Not Found</h1>
       <p className="text-body-bold text-gray-600 mb-8">The post you are looking for does not exist or was deleted.</p>
       <Link href={"/"} className="bg-primary-500 text-white px-4 py-2.5 rounded-xl hover:bg-cyan-400 hover:underline hover:text-blue">
         Home
       </Link>
     </section>
     
     )
   }

  return (
    <section className='relative'>
        <h1 className='text-center text-heading3-bold mb-4'>Edit Post</h1>

        <EditPost 
         key={post.idpost}
         id={post.idpost}
         currentUserId={user.id}
         parentId={post.parent_id}
         content={post.content}
         createdAt={post.created_at}
        
         image={post.author.image}
         username={post.author.username}
         authorId={post.author_id}
         contentImage={post.image}
         title={post.title}
         prompt={post.prompt}
         userId={user.id}
        />



    </section>
  )
}

export default page