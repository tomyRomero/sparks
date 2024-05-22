import Post from '@/components/cards/Post';
import Searchbar from '@/components/shared/Searchbar';
import { searchPosts } from '@/lib/actions/post.actions';
import { fetchUser } from '@/lib/actions/user.actions';
import { currentUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import React from 'react'

const page = async (
    {
    searchParams,
  }: {
    searchParams: { [key: string]: string | undefined };
  }
  ) => {

    const user = await currentUser();
    if (!user) redirect('/');
  
  
    const userInfo = await fetchUser(user.id);
    if (!userInfo?.onboarded) redirect("/onboarding");
  
    const searchQuery = searchParams.q;
    const pageNumber = searchParams?.page ? + searchParams.page : 1;
    const pageSize = 20;

    const result = await searchPosts({ searchQuery, pageNumber, pageSize });

  return (
    <>
    <h1 className='head-text text-left text-black mb-4'>Search for Posts...</h1>
    <Searchbar routeType='search-post' />
    <section className='mt-9 flex flex-col gap-10'>
        {result.results?.length === 0 ? (
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
    </>
  )
}

export default page