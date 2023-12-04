"use client"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react";
import { getImageData } from "@/lib/s3";
import { fetchUser } from "@/lib/actions/user.actions";
import { set } from "zod";

interface Chat {
    chatRead : boolean;
    receiverID : string;
    chatMessages: {
        text: string;
        sender: string;
        timestamp: string;
    }[];
    receiverPicture: string;
    chatName: string;
}

const ChatLogs = ({ chatRead, receiverID, chatMessages, receiverPicture, chatName} : Chat) => {
   const [chatPicture, setChatPicture] = useState("/assets/imgloader.svg")

   console.log("Receiver_ID: ", receiverID)


   useEffect( ()=> {
        const getImage = async () => {
        let imgResult = "/assets/profile.svg"
    
        if (receiverPicture.startsWith('user')) {
          const res = await getImageData(receiverPicture);
          imgResult = res;
        } else {
          imgResult = receiverPicture;
        }
        setChatPicture(imgResult)
        }
        
        getImage();

   }, [])

   const getLastText = () => {
    const lastIndex = chatMessages[chatMessages.length - 1]
    return lastIndex.text;
   }

   const getLastTime = () => {
    const lastIndex = chatMessages[chatMessages.length - 1]
    return lastIndex.timestamp
   }

  return (
    <Link
    href={`/chat/${receiverID}`}
    className="hover:bg-primary-500 rounded-lg mt-4 bg-white"
  >
  <div key={chatName} className="flex items-center p-4">
    <div className="relative rounded-full overflow-hidden">
      <Image
        src={chatPicture}
        alt={`Chat with ${chatName}`}
        width={65}
        height={65}
        className="rounded-full object-contain"
      />
      {chatRead === false && (
        <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></div>
      )}
    </div>
    <div className="ml-4 flex flex-col">
      <p className={`text-black ${chatRead === false ? 'font-bold ' : ''} max-md:hidden`}>
        {chatName}
      </p>
      <p className={`text-black ${chatRead === false ? 'font-bold ' : ''} md:hidden`}>
        {chatName.length > 10 ? `${chatName.slice(0, 10)}...` : chatName}
      </p>
      <p className={`text-black ${chatRead === false ? 'font-bold ' : ''}`}>
        {getLastText().length > 20
          ? `${getLastText().slice(0, 20)}...`
          : getLastText()}
      </p>
    </div>
    <div className={`ml-auto text-black ${chatRead === false ? 'font-bold' : ''}`}>{getLastTime()}</div>
  </div>
  </Link>
  )
}

export default ChatLogs