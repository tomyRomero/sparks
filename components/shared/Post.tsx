"use client"

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getImageData } from "@/lib/s3";


interface Props {
  id: string;
  currentUserId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  comments: {
    author: {
      image: string;
    };
  }[];
  isComment?: boolean;
  image: string;
  username: string
}

function Post({
  id,
  currentUserId,
  parentId,
  content,
  createdAt,
  comments,
  isComment,
  image,
  username
}: Props) {
    const [img, setImg] = useState('/assets/profile.svg');
    const [like, setLike] = useState(false);
    const [floatingHearts, setFloatingHearts] = useState([]);

    console.log("Inside Post")
    console.log("id:" , id)
    console.log("currentUserId: ", currentUserId)
    console.log("parentId:", parentId)
    console.log("content:", content)
    console.log("created at:", createdAt)
    console.log("isComment:", isComment )
    console.log("image:", image)

    useEffect( () => {
        const load = async () => {
          try{
            if(image.startsWith('user'))
            {
                const res = await getImageData(image);
                if(res)
                {
                setImg(res);
                }
            }else{
                setImg(image)
            }
          }catch(error)
          {
            console.log("Error" , error)
          }
        }
  
        load();
  
      }, [])

      const handleLikeClick = () => {
        // Perform your "like" logic here
        setLike(!like);
      };

  return (
    <article
      className={`flex w-full flex-col rounded-xl ${
        isComment ? "px-0 xs:px-7" : "bg-primary-500 p-7"
      }`}
    >
      <div className='flex items-start justify-between'>
        <div className='flex w-full flex-1 flex-row gap-4'>
          <div className='flex flex-col items-center'>
            <Link href={`/profile/${username}`} className='relative h-11 w-11'>
              <Image
                src={img}
                alt='user_community_image'
                fill
                className='cursor-pointer rounded-full'
              />
            </Link>

            <div className='card_bar' />
          </div>

          <div className='flex w-full flex-col'>
            <Link href={`/profile/${username}`} className='w-fit'>
              <h4 className='cursor-pointer text-base-semibold text-light-1'>
                {username}
              </h4>
            </Link>

            <p className='mt-2 text-small-regular text-light-2'>{content}</p>

            <div className={`${isComment && "mb-10"} mt-5 flex flex-col gap-3`}>
              <div className='flex gap-3.5'>
                <Image
                  src={`${like? '/assets/like.svg' : '/assets/unlike.svg'  }`}
                  alt='heart'
                  width={24}
                  height={24}
                  className={`cursor-pointer object-contain ${like ? 'pop-animation active' : 'pop-animation'}`}
                  onClick={() => {handleLikeClick()}}
                />
                <Link href={`/thread/${id}`}>
                  <Image
                    src='/assets/uncomment.svg'
                    alt='comment'
                    width={24}
                    height={24}
                    className='cursor-pointer object-contain'
                  />
                </Link>
                <Image
                  src='/assets/share.svg'
                  alt='heart'
                  width={24}
                  height={24}
                  className='cursor-pointer object-contain'
                />
              </div>

              {isComment && comments.length > 0 && (
                <Link href={`/thread/${id}`}>
                  <p className='mt-1 text-subtle-medium text-gray-1'>
                    {comments.length} repl{comments.length > 1 ? "ies" : "y"}
                  </p>
                </Link>
              )}
            </div>
          </div>
        </div>
        
      </div>

      {/* {!isComment && comments.length > 0 && (
        <div className='ml-1 mt-3 flex items-center gap-2'>
          {comments.slice(0, 2).map((comment, index) => (
            <Image
              key={index}
              src={comment.author.image}
              alt={`user_${index}`}
              width={24}
              height={24}
              className={`${index !== 0 && "-ml-5"} rounded-full object-cover`}
            />
          ))} */}

          {/* <Link href={`/thread/${id}`}>
            <p className='mt-1 text-subtle-medium text-gray-1'>
              {comments.length} repl{comments.length > 1 ? "ies" : "y"}
            </p>
          </Link>
        </div>
      )} */}
       {/* Render the floating hearts */}
      
                    
    </article>
  );
}

export default Post;