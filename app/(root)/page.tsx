import Post from "@/components/cards/Post";
import { fetchPosts} from "@/lib/actions/post.actions";
import { currentUser } from "@clerk/nextjs";
import { fetchUser } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";
import Pagination from "@/components/shared/Pagination";
import FilterBox from "@/components/shared/FilterBox";
import SearchButton from "@/components/shared/SearchButton";


async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const result: any = await fetchPosts(
    searchParams.page ? + searchParams.page : 1,
     5, 
    searchParams.title ? searchParams.title : ""
  )  

  const includesTitle = searchParams.title? true : false

 return (
    <>
      <h1 className='head-text text-left text-black mb-4'>Recent Sparks...</h1>
      <FilterBox />
      <br/>
      <SearchButton />
      <section className='mt-9 flex flex-col gap-10'>
        {result?.length === 0 ? (
          <p className='no-result'>No posts found</p>
        ) : (
          <>
          
            {result.results.map((post: any) => (
              <Post
                key={post.idpost}
                id={post.idpost}
                currentUserId={user.id}
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
                prompt={post.prompt}
              />
            ))}

          </>
        )}
      </section>
      <Pagination
        path="/"
        pageNumber={searchParams?.page ? + searchParams.page : 1}
        isNext={result.isNext}
        filter={includesTitle}
      />
    </>
  );
}

export default Home;
