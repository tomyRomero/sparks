"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {getRes } from '@/lib/s3';
import { fetchPostById } from '@/lib/actions/post.actions';

interface Props{
   parent_Id: string;
   image: string;
   author_username: string;
   created_at: string;
   content: string;
}

const CommentActivity = ({ parent_Id, image, author_username, created_at , content}: Props) => {
    const [img, setImg] = useState("/assets/imgloader.svg");
    const [parentContent, setParentContent]= useState("");

    useEffect(() => { 
        const loadProfile = async () => {
          try {
            let loadImg = image
    
            setImg(await getRes(loadImg))
          } catch (error) {
            setImg('/assets/profile.svg');
            console.log("Error", error);
          }
        };

        const loadParentPost = async ()=> {
        const post = await fetchPostById(parent_Id)
        if(post)
        {
        setParentContent(post.content)
        }
    }
              
    loadProfile();
    loadParentPost();
}, [])

function truncateWords(str: string, maxWords: number): string{
    const words = str.split(' ');
    const truncatedWords = words.slice(0, maxWords).join(' ');
  
    return words.length <= maxWords ? str : `${truncatedWords}...`;
  }

  return (
    <Link  href={`/post/${parent_Id}`}>
    <article className={`activity-card hover:bg-cyan-500`}>
        <Image
            src={img}
            alt='user_logo'
            width={20}
            height={20}
            className='rounded-full object-cover'
        />
    <p className='!text-small-regular text-light-1'>
    <span className='mr-1 text-primary-500'>
    {author_username}
    </span>{" "}
        <>replied 
        <span className='mr-1 text-primary-500'>{` ${truncateWords(content, 4)} `}</span>
        to 
        <span className='mr-1 text-primary-500'>{` ${truncateWords(parentContent, 4)}`}</span>
        post!
        </>
        <span>{` at ${created_at}`}</span>
</p>
  
</article>

</Link>
  )
}

export default CommentActivity