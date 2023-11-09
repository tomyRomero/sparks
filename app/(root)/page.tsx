import Post from "@/components/shared/Post";
import UserImg from "@/components/shared/UserImg";
import { fetchPosts } from "@/lib/actions/post.actions";
import { currentUser } from "@clerk/nextjs";
import { fetchUser } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";

async function Home({
  searchParams
}: {
  searchParams: { [key: string]: string | undefined }, data:any;
}) 
{
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const result: any = await fetchPosts(
    searchParams.page ? +searchParams.page : 1,
     30
  )



 return (
    <>
      <h1 className='head-text text-left text-black'>Home</h1>
      <section className='mt-9 flex flex-col gap-10'>
        {result?.length === 0 ? (
          <p className='no-result'>No threads found</p>
        ) : (
          <>
            {result.map((post: any) => (
              <Post
                key={post.idpost}
                id={post.idpost}
                currentUserId={user.id}
                parentId={post.parent_Id}
                content={post.content}
                createdAt={post.created_at}
                comments={post.comment}
                image={post.author_image}
                username={post.author_username}
              />
            ))}
          </>
        )}
      </section>
      
    </>
  );
}

export default Home;