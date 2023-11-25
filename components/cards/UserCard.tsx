"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { getImageData } from "@/lib/s3";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";

interface Props {
  id: string;
  name: string;
  username: string;
  imgUrl: string;
}



function UserCard({ id, name, username, imgUrl}: Props) {
  const [img, setImg] = useState("/assets/imgloader.svg")
  const router = useRouter();

  useEffect(()=> {
    const loadProfile = async ()=> {
    let imgResult = "/assets/profile.svg"

    if (imgUrl.startsWith('user')) {
      const res = await getImageData(imgUrl);
      imgResult = res;
    } else {
      imgResult = imgUrl;
    }
    setImg(imgResult)
    }

    loadProfile()
    
  }, [])
  

  return (
    <article className='user-card'>
      <div className='user-card_avatar'>
        <div className='relative h-12 w-12'>
          <Image
            src={img}
            alt='user_logo'
            fill
            className='rounded-full object-cover'
          />
        </div>

        <div className='flex-1 text-ellipsis'>
          <h4 className='text-base-semibold text-light-1'>{name}</h4>
          <p className='text-small-medium text-gray-1'>@{username}</p>
        </div>
      </div>

      <Button
        className='user-card_btn'
        onClick={() => {
            router.push(`/profile/${id}`);
          
        }}
      >
        View
      </Button>
    </article>
  );
}

export default UserCard;