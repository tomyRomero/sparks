"use client"

import React, { useEffect, useState } from 'react';
import ChatLogs from './cards/ChatLogs';
import { Button } from './ui/button';

const Chatbox = ({ chats }: any) => {
  const [page, setPage] = useState(0);
  const itemsPerPage = 2;

  // Calculate the starting index for slicing the array
  const startIndex = page * itemsPerPage;

  // Slice the array to get the items for the current page
  const slicedChats = chats.slice(startIndex, startIndex + itemsPerPage);

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
    <div className="p-4 flex flex-col overflow-y-auto overflow-hidden">
      {chats.length === 0 ? (
        <p className="text-light-1 text-center">
          No Recent Chats, Click on A User Bubble To Get Started, Can Also Search for Users to Message
        </p>
      ) : (
        <>
          {slicedChats.map((chat: any) => (
            <ChatLogs
              key={chat.receiver_id} // Add a unique key to each mapped element
              chatRead={chat.read_status}
              senderID={chat.sender_id}
              receiverID={chat.receiver_id}
              chatMessages={chat.messages}
              receiverPicture={chat.user_image}
              chatName={chat.user_username}
              isHome={false}
              path={'/chat'}
            />
          ))}
        </>
      )}
      <div className="pagination max-sm:mt-2.5">
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
          disabled={startIndex + itemsPerPage >= chats.length}
          className='!text-small-regular text-light-2 bg-primary-500'
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default Chatbox;
