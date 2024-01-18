"use client"

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getImageData, getRes } from "@/lib/s3";

interface Props {
  accountId: string;
  authUserId: string;
  name: string;
  username: string;
  imgUrl: string;
  bio: string;
  type?: string;
}

function ProfileHeader({
  accountId,
  authUserId,
  name,
  username,
  imgUrl,
  bio,
  type,
}: Props) {
  const [img, setImg] = useState("/assets/imgloader.svg")

  useEffect(()=> {
    const loadProfile = async () => {
    setImg( await getRes(imgUrl))
    }

    loadProfile()

  },[]
  )

  return (
    <div className='flex w-full flex-col justify-start'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='relative h-20 w-20 object-cover'>
            <Image
              src={img}
              alt='logo'
              fill
              className='rounded-full object-cover shadow-2xl'
            />
          </div>

          <div className='flex-1'>
            <h2 className='text-left text-heading3-bold text-primary-500'>
              {name}
            </h2>
            <p className='text-base-medium text-gray-1'>@{username}</p>
          </div>
        </div>
        {accountId === authUserId && (
          <Link href='/profile/edit'>
            <div className='flex cursor-pointer gap-1 rounded-lg hover:bg-primary-500 bg-dark-3 px-4 py-2'>
                  
              <Image
                src='/assets/edit.svg'
                alt='logout'
                width={26}
                height={26}
              />
               <p className='text-light-2 max-sm:hidden'>Edit</p>       
            </div>
          </Link>
        )}
        {accountId !== authUserId && (
           <Link href={`/chat/${accountId}`}>
           <div className='flex cursor-pointer gap-1 rounded-lg hover:bg-primary-500 bg-dark-3 px-4 py-2'>
                 
             <Image
               src='/assets/message.svg'
               alt='logout'
               width={26}
               height={26}
             />
              <p className='text-light-2 max-sm:hidden'>Message</p>       
           </div>
         </Link>
        )}
      </div>
      <h2 className="text-primary-500 mt-4 text-body-bold">Biography: </h2>
      <p className='mt-6 max-w-lg text-base-regular text-black'>{bio}</p>
      <div className='mt-12 h-0.5 w-full bg-dark-3' />
    </div>
  );
}

export default ProfileHeader;