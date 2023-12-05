"use client"

import { useRef, useState } from 'react';
import Image from 'next/image';
import UserBubble from '@/components/cards/UserBubble';

const HorizontalScroll = ({ results, bubbles }: any) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [visibleBubbles, setVisibleBubbles] = useState(bubbles); // Number of visible bubbles, adjust as needed
  const [startIndex, setStartIndex] = useState(0);

  const slideLeft = () => {
    if (sliderRef.current) {
      const newIndex = Math.max(0, startIndex - visibleBubbles);
      setStartIndex(newIndex);
    }
  };

  const slideRight = () => {
    if (sliderRef.current) {
      const newIndex = Math.min(results.users.length - visibleBubbles, startIndex + visibleBubbles);
      setStartIndex(newIndex);
    }
  };

  return (
    <div className="relative flex items-center gap-4 w-full">
      <Image
        src="/assets/leftarrow.svg"
        alt="left arrow slider"
        className="opacity-50 cursor-pointer hover:opacity-100"
        onClick={slideLeft}
        width={20}
        height={20}
      />
      <div ref={sliderRef} className="flex overflow-x-auto scrollbar-hide">
        {results.users.length === 0 ? (
          <p className="no-result">No Results</p>
        ) : (
          <div className={`flex`}>
            {results.users.slice(startIndex, startIndex + visibleBubbles).map((person: any) => (
              <div
                key={person.id}
                className={`flex-shrink-0 p-2 cursor-pointer hover:scale-105 ease-in-out duration-300`}
              >
                <UserBubble
                  id={person.id}
                  name={person.name}
                  username={person.username}
                  imgUrl={person.image}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <Image
        src="/assets/rightarrow.svg"
        alt="right arrow slider"
        className="opacity-50 cursor-pointer hover:opacity-100 ml-auto"
        onClick={slideRight}
        width={20}
        height={20}
      />
    </div>
  );
};

export default HorizontalScroll;
