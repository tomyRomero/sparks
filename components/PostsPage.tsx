"use client"

import React, { useState } from 'react';
import Post from './cards/Post';
import { Button } from './ui/button';

const PostsPage = ({ posts, currentUserId }: any) => {
  const [page, setPage] = useState(0);
  const itemsPerPage = 5;

  // Calculate the starting index for slicing the array
  const startIndex = page * itemsPerPage;

  // Slice the array to get the items for the current page
  const slicedPosts = posts.slice(startIndex, startIndex + itemsPerPage);

  const addNewValue = () => {
    setPage((prevState) => {
      // Add the new value to the previous state
      return prevState + 1;
    });
  };

  const subtractNewValue = () => {
    setPage((prevState) => {
      // Subtract the new value from the previous state
      return Math.max(0, prevState - 1);
    });
  };

  const handleNavigation = (type: string) => {
    if (type === 'prev') {
      subtractNewValue();
    } else if (type === 'next') {
      addNewValue();
    }
  };

  return (
    <section className='mt-9 flex flex-col gap-10'>
      {posts.length === 0 ? (
        <p className='text-primary-500 text-center'>
          No Posts Available
        </p>
      ) : (
        <>
          {slicedPosts.map((post: any) => (
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
              likes={post.likes ? post.likes : ''}
              authorId={post.author_id}
              title={post.title}
              prompt={post.prompt}
            />
          ))}
        </>
      )}
      <div className='pagination'>
        <Button
          onClick={() => handleNavigation('prev')}
          disabled={page === 0}
          className='!text-small-regular text-light-2 bg-primary-500'
        >
          Prev
        </Button>
        <p className='text-small-semibold text-light-2'>{page + 1}</p>
        <Button
          onClick={() => handleNavigation('next')}
          disabled={startIndex + itemsPerPage >= posts.length}
          className='!text-small-regular text-light-2 bg-primary-500'
        >
          Next
        </Button>
      </div>
    </section>
  );
};

export default PostsPage;
