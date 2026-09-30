"use client"

import React, { useState } from 'react';
import CommentActivity from './shared/CommentActivity';
import { Button } from './ui/button';

const CommentPage = ({ comments }: any) => {
  const [page, setPage] = useState(0);
  const itemsPerPage = 6;

  // Calculate the starting index for slicing the array
  const startIndex = page * itemsPerPage;

  // Slice the array to get the items for the current page
  const slicedComments = comments?.slice(startIndex, startIndex + itemsPerPage);

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
    <section className='mt-9 flex flex-col gap-8'>
      {comments.length === 0 && (
        <h2 className="text-center text-primary-500">No Comments</h2>
      )}
      {slicedComments?.map((comment: any) => (
        <CommentActivity
          key={comment.comment_id} // Add a unique key to each mapped element
          parent_Id={comment.parent_id}
          image={comment.author_image}
          author_username={comment.author_username}
          created_at={comment.created_at}
          content={comment.content}
        />
      ))}
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
          disabled={startIndex + itemsPerPage >= comments?.length}
          className='!text-small-regular text-light-2 bg-primary-500'
        >
          Next
        </Button>
      </div>
    </section>
  );
};

export default CommentPage;
