"use client"

import { fetchPosts } from '@/lib/actions/post.actions';
import React, { useEffect, useRef, useState } from 'react'
import Post from './cards/Post';
import Image from 'next/image';
import { useAppContext } from '@/lib/AppContext';
import { Button } from './ui/button';

const InfiniteFeed = ({user}: {user: string|null}) => {

    const {title} = useAppContext();
    const [posts, setPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isNext, setIsNext] = useState(true);

    useEffect(() => {
      // Reset page to 1 whenever the title (search term) changes
      setPage(1);
      // Reset posts array when title changes
      setPosts([]);
    }, [title]);

    useEffect(() => {
      const loadPosts = async () => {
        setIsLoading(true);
        const result: any = await fetchPosts(page, 5, title ? title : "");
        console.log("posts: " , result)
        setIsLoading(false);
        if (result) {
          setPosts((prevPosts) => [...prevPosts, ...result.results]);
          setIsNext(result.isNext);
        }
      };
      loadPosts();
     
    }, [page, title]);
  
    useEffect(() => {
      const handleScroll = () => {
        if (
          containerRef.current &&
          window.innerHeight + window.scrollY >= document.body.offsetHeight &&
          !isLoading &&
          isNext
        ) {
          setPage((prevPage) => prevPage + 1);
        }

      };
      window.addEventListener('scroll', handleScroll);
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }, [isLoading, isNext]);

    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
      const storedScrollY = localStorage.getItem('infiniteFeedScrollPosition');
      if (storedScrollY) {
        window.scrollTo(0, parseInt(storedScrollY, 10));
      }
    }, []);
 
    useEffect(() => {
      const handleBeforeUnload = () => {
        localStorage.setItem('infiniteFeedScrollPosition', window.scrollY.toString());
      };
  
      window.addEventListener('beforeunload', handleBeforeUnload);
  
      // Cleanup function
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }, []);
    

   
  return (
      <>
        <section ref={containerRef} className='mt-9 flex flex-col gap-10'>
          {!isLoading && posts[0] === null ? (
            <p className='no-result'>No posts found</p>
          ) : (
            <>
              {posts.map((post: any, index: number) => (
                <Post
                  key={index}
                  id={post.idpost}
                  currentUserId={user}
                  parentId={post.parent_Id}
                  content={post.content}
                  createdAt={post.created_at}
                  comments={post.children}
                  image={post.author_image}
                  contentImage={post.image}
                  username={post.author_username}
                  likes={post.likes ? post.likes : ''}
                  authorId={post.author_id}
                  title={post.title}
                  prompt={post.prompt}
                />
              ))}
            </>
          )}
        </section>
        {isLoading && <div className='w-full flex justify-center'>
          <Image 
          src={'/assets/spinner.svg'}
          alt={'loading animation'}   
          width={150} 
          height={150} 
          className='mx-auto'     
          />
          </div>}
        {!isNext && !isLoading && 
        <div className='w-full pt-5 flex justify-center'>
         <Button className='bg-black border border-black text-white hover:bg-transparent hover:text-black' 
         onClick={scrollToTop}>
           <div className='flex gap-1'>
           <Image 
           src="/assets/uparrow.png"
           alt="search icon"
           width={24}
           height={24}
           />
           Return to Top
           </div>
         </Button>
         </div>
        }
      </>
    );
}

export default React.memo(InfiniteFeed);