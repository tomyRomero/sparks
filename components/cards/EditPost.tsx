"use client"

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect} from "react";
import { getRes } from "@/lib/s3";
import React from "react";
import Prompt from "../shared/Prompt";
import EditRegular from "../forms/EditRegular";
import EditComment from "../forms/EditComment";
import EditSpark from "../forms/EditSpark";

interface Props {
  id: string;
  currentUserId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  isComment?: boolean;
  image: string;
  username: string;
  authorId: string;
  contentImage?: string
  title: string;
  prompt : string, 
  userId: string
}

function EditPost({
  id,
  currentUserId,
  parentId,
  content,
  createdAt,
  isComment,
  image,
  username, 
  authorId,
  contentImage,
  title, prompt, userId
}: Props) {


    const [img, setImg] = useState('/assets/imgloader.svg');

    useEffect(() => {
      const loadProfile = async () => {
       setImg(await getRes(image))
      };

      loadProfile()
    }, []);
    


  return (
    <>
    <article className={`bg-black border-solid border-2 border-primary-500 rounded-xl`}>
    <div
      className={`flex w-full flex-col p-5`}
    >
      <div className='flex items-start justify-between'>
        <div className='flex w-full flex-1 flex-row gap-4'>
          <div className='flex flex-col items-center'>
            <Link href={`/profile/${authorId}`} className='relative h-11 w-11'>
              <Image
                src={img}
                alt='user_image'
                fill
                className='cursor-pointer rounded-full'
              />
            </Link>

            <div className='card_bar' />
          </div>

          <div className='flex w-full flex-col'>
            <Link href={`/profile/${authorId}`} className='w-fit'>
              <h4 className={`cursor-pointer text-base-semibold text-light-1 ${isComment ? 'text-primary-500' : ''}`}>
                {username}
              </h4>
            </Link>

            {/* Edit Form For Regular*/}
            {title === 'Regular' && (
              <EditRegular postId={id} contentImage={contentImage? contentImage : ""} content={content} userId={userId} isComment={false} parentId={parentId ? parentId : ""}/>
            )}
            
             {/* Content For Comment*/}
            {title === 'Comment' && (
             <EditComment content={content} userId={userId} isComment={true} parentId={parentId ? parentId : ""} postId={id}/>
            )}

            {/* Content for Sparks */}
            {title !== 'Comment' && title !== "Regular" && (
              <EditSpark title={title} postId={id} contentImage={contentImage? contentImage : ""} content={content} userId={userId} isComment={false} parentId={parentId ? parentId : ""}/>
            )}

            <div className={`mt-5 flex flex-col gap-3`}>
              <div className='flex gap-3.5'>
                  {/* Sparks Title Modal With Prompt */}
                  <div className="max-sm:hidden">
                <Prompt title ={title} prompt={prompt}/>
                </div>
              </div>
              <div className="sm:hidden">
              <Prompt title ={title} prompt={prompt} />
              </div>
              <p className="text-subtle-medium text-white">{createdAt}</p>
            </div>
          </div>
        </div>
      </div>

      </div>
    </article>
     
    </>
  )
}

export default EditPost;
