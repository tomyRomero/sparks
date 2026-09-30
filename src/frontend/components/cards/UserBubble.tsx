"use client"

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect} from "react";
import { getImageData, getRes } from "@/lib/s3";


interface Bubble{
    id: string;
    name: string;
    username: string;
    imgUrl: string;
}

const UserBubble = ({id,name,username, imgUrl}: Bubble) => {
    const [img, setImg] = useState("/assets/imgloader.svg")

    useEffect(()=> {
        const loadProfile = async ()=> {
        
          setImg(await getRes(imgUrl))
        }

        loadProfile()
        
      }, [])

  const isLongUsername = username.length > 6;

  return (
    <div className="flex flex-col items-center">
    <Link href={`/chat/${id}`}>
      <div className="flex flex-col items-center">
        <div
          className="relative rounded-full overflow-hidden"
          style={{ aspectRatio: '1/1', width: '84px', height: '84px' }}
        >
          <Image
            src={img}
            alt={"Chat Bubble"}
            layout="fill"
            objectFit="cover"
            className="rounded-full"
          />
        </div>
        <h2 className="text-light-1 mt-2">{name}</h2>
        {isLongUsername ? (
            <div className="ml-2 text-gray-1">
              <p>@{username.substring(0, 6)}</p>
              <p>{username.substring(6)}</p>
            </div>
          ) : (
            <p className="ml-2 text-gray-1">@{username}</p>
          )}
      </div>
    </Link>
  </div>
  )
}

export default UserBubble