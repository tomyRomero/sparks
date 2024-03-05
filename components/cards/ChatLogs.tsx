"use client"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react";
import { getRes } from "@/lib/s3";
import { getChatBySenderAndReceiver, revalData } from "@/lib/actions/chat.actions";
import { useAppContext } from "@/lib/AppContext";
import { useRouter } from "next/navigation";


interface Chat {
    chatRead : boolean;
    senderID: string
    receiverID : string;
    chatMessages: {
        text: string;
        sender: string;
        timestamp: string;
    }[];
    receiverPicture: string;
    chatName: string;
    isHome: boolean;
    path: string;
}

const ChatLogs = ({ chatRead, senderID, receiverID, chatMessages, receiverPicture, chatName, isHome , path} : Chat) => {

   const {globalMessages, setGlobalMessages,  readMessages, pusherChannel} =  useAppContext();

   const [chatPicture, setChatPicture] = useState("/assets/imgloader.svg")
   const [isMe, setIsMe] = useState(false);
   const [messages, setMessages] = useState(chatMessages);
   const [read, setRead] = useState(true)
  
   const router = useRouter();

   useEffect( ()=> {
        const getImage = async () => {
        setChatPicture(await getRes(receiverPicture))
        }
        
        getImage();
   }, [])

   useEffect( ()=> {

    const lastIndex = messages[ messages.length - 1]
    const lastMessageSender = lastIndex.sender

    if( lastMessageSender === senderID)
    {
      setIsMe(true);
    }else{
      setIsMe(false);
    }

    const updateRead = async ()=> {
      const chat = await getChatBySenderAndReceiver(receiverID, senderID);
      const readStatus = chat.read_status
      setRead(readStatus)

    }

    updateRead();

   }, [messages , readMessages])

   useEffect(() => {
    try {
      const channel =  pusherChannel

      channel.bind('message', (data: any) => {
        // Handle new message received from Pusher
        // Update the state with the new message if the sender ID and reciever ID match
        setGlobalMessages((prevGlobalMessages: any) => [...prevGlobalMessages, data]);
        
        if(data.sender === senderID && data.receiver === receiverID || data.sender === receiverID && data.receiver === senderID)
        {
          setMessages((prevMessages) => [...prevMessages, data]);
          
          const newArr = [...messages, data]
          
          if(data.sender !== senderID)
          {
            setRead(false);
          }
        }

      });

      // Clean up on component unmount
      // return () => {
      //   channel.unbind('message');
      // };

    } catch (error) {
      console.error(error);
    }
  }, [messages,  globalMessages]);

   const getLastText = () => {
    const lastIndex = messages[messages.length - 1]
    return lastIndex.text;
   }

   const getLastTime = () => {
    const lastIndex = messages[messages.length - 1]
    return lastIndex.timestamp
   }


  return (
    <Link
    href={`/chat/${receiverID}`}
    className="hover:bg-cyan-500 rounded-lg mt-4 bg-white"
  >
  <div key={chatName} className={`flex p-4 items-center`}>
    <div className="relative rounded-full overflow-hidden">
      <Image
        src={chatPicture}
        alt={`Chat with ${chatName}`}
        width={isHome ? 40 : 65}
        height={isHome ? 40 : 65}
        className="rounded-full object-cover aspect-[1/1]"
      />
      {!chatRead && (
        <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></div>
      )}
    </div>


    <div className="ml-4 flex-grow flex flex-col">

      {/* Chat Name Logic */}
      <p className={`text-black font-bold max-md:hidden`}>
        {chatName}
      </p>
      <p className={`text-black font-bold md:hidden`}>
        {chatName.length > 10 ? `${chatName.slice(0, 10)}...` : chatName}
      </p>


      {/* Text Content Logic */}
      {isMe && (
        <p className={`text-black`}>
        {getLastText().length > 20
          ? `You: ${getLastText().slice(0, 20)}...`
          : `You: ${getLastText()}`}
      </p>
      )}  

      {!isMe && (
        <p className={`text-black ${!read ? 'font-bold  text-primary-500' : ''}`}>
        {getLastText().length > 20
          ? `${getLastText().slice(0, 20)}...`
          : getLastText()}
      </p>
      )}  

      {isHome && (
      <div className={`mr-auto text-black text-right ${!read && !isMe ? 'font-bold' : ''}`}>
          {/* Time */}
          {getLastTime().split(' ')[1]}{' '}
          {getLastTime().split(' ')[2]} {/* AM/PM */}
      </div>
    )}

    </div>
    
    {!isHome && (
      <div className={`ml-auto text-black ${!read && !isMe ? 'font-bold' : ''}`}>
        <div >
          {/* Time */}
          {getLastTime().split(' ')[1]}{' '}
          {getLastTime().split(' ')[2]} {/* AM/PM */}
        </div>
      </div>
    )}



  </div>
  </Link>
  )
}

export default ChatLogs