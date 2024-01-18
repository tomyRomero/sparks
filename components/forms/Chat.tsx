"use client"

import Image from "next/image"
import { useState, useEffect, useRef} from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
  } from "@/components/ui/form";
  
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { messageValdiation } from "@/lib/validations/chat";
import { zodResolver } from "@hookform/resolvers/zod";
import { markChatAsRead, revalData, sendMessage, updateChatForOther, updateOnlineStatus } from "@/lib/actions/chat.actions";
import { usePathname, useRouter } from "next/navigation";
import { getImageData, getRes } from "@/lib/s3";
import pusherClient from "@/lib/pusher";
import { getDateTime } from "@/lib/utils";
import { useAppContext } from "@/lib/AppContext";

interface chat{
    chatPicture: string;
    chatName: string;
    chatMessages: {
        text: string;
        sender: string;
        receiver: string;
        timestamp: string;
    }[];
    userID: string;
    receiver: string;
    isRead: boolean;
}

const Chat = ({chatPicture, chatName, chatMessages, userID, receiver , isRead}: chat) => {
  const [img, setImg] = useState("/assets/imgloader.svg")
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState(chatMessages);
  const messageEndRef = useRef<HTMLInputElement>(null);
  const [read, setRead] = useState(false);
  const [active, setActive] = useState(false);
  const [didSend , setDidSend] = useState(false);
  

  const pathname = usePathname();
  const router = useRouter();

  const { setGlobalMessages, readMessages, setReadMessages, pusherChannel} = useAppContext();

  useEffect(() => {
    try {

      const channel = pusherChannel

       // Handle the event for updating the online status
      channel.bind('updateOnlineStatus', (data: any) => {
        // Handle updating the online status of the user
        // Use the data to update the online status in UI

        if(data.userId === receiver)
        {
          setActive(true);
        }
  
      });

      channel.bind('message', (data: any) => {
        // Handle new message received from Pusher

        // Update the state with the new message if the sender ID and reciever ID match

        setGlobalMessages((prevGlobalMessages: any) => [...prevGlobalMessages, data]);

        if(data.sender === userID && data.receiver === receiver || data.sender === receiver && data.receiver === userID)
        {
          setRead(false);
         
          setMessages((prevMessages) => [...prevMessages, data]);
          const newArr = [...messages, data]
         
        }

      });
  
    // Handle the event for updating the read status
    channel.bind('updateReadStatus', (data: any) => {
      // Handle updating the read status of the messages
      // Filter and update the messages based on the data received

      // Check if the current user is the sender of the message
      if(data.sender === userID && data.receiver === receiver)
      {
        setRead(true);
      }
      
    });

      // Clean up on component unmount
      return () => {
        channel.unbind('message');
        channel.unbind('updateReadStatus');
      };

    } catch (error) {
      console.error(error);
    }
  }, [chatMessages, setMessages,loading, setLoading]);

  useEffect ( ()=> {

    const readChat = async ()=> {
      try{
        //Function that updates the readStatus of the Chat and also uses Pusher
        const lastMessage = messages[messages.length - 1]
      
        if(lastMessage.sender !== userID)
        {
          const read = await markChatAsRead(receiver, userID, messages, pathname);
          setReadMessages(!readMessages);
        }
        
      }
      catch(error){
        console.log(error);
      }
    }

    readChat();
   
  }, [read])

  useEffect( ()=> {

    //Check To See If Chat Was Read Already
    if(messages.length > 0)
    {
      const lastMessage = messages[messages.length - 1]
      
      if(isRead && lastMessage.sender === userID && lastMessage.receiver === receiver)
      {
        setRead(true);
      }

    }

    //Load Chat Image
    const loadChatImage = async ()=> {
      setImg(await getRes(chatPicture))

    }

    loadChatImage()
  }, [])
  
  const scrollTobottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollTobottom();
  }, [messages]);


  const form = useForm <z.infer<typeof messageValdiation>>({
    resolver: zodResolver(messageValdiation),
    defaultValues: {
      message: "",
    },
  });

  const onSubmit = async (data: { message: string }) => {
    setRead(false)
    setLoading(true)
    
    const timestamp = getDateTime();
    
    // Call the sendMessage function with the entered message and sender

    const newMessages = [
      ...messages,
      { text: data.message, sender: userID, receiver: receiver, timestamp: timestamp },
    ]

    //Send to Pusher and also save to Database
    const didSend = await sendMessage(data.message, userID, timestamp, receiver, newMessages, pathname);
    const didUpdate = await updateChatForOther(receiver, userID, newMessages, pathname);
    
    if(didSend)
    {
      setDidSend(true);
    }

    // Clear the form input after sending the message
    setLoading(false)
    form.setValue("message", "");
  };

  const goBack = ()=> {
    router.push("/chat")
  }

  return (
    <section className="w-full h-[80vh] flex flex-col bg-black rounded-xl overflow-hidden">
    <div className="flex items-center p-2 border-b-2 border-primary-500 bg-primary-500">

      {/* Back button */}

      <Button onClick={goBack} className='bg-transparent hover:bg-transparent hover:scale-125 ease-in-out duration-300'>
          {<Image src={"/assets/back.svg"} alt="loading" width={30} height={30}/> }
        </Button>

      {/* User details in the middle */}

        <div className="flex flex-col items-center mx-auto cursor-pointer relative">
        <div className="relative rounded-full overflow-hidden">
          <Image
            src={img}
            alt={`Chat with ${chatName}`}
            width={40}
            height={40}
            className="rounded-full object-contain hover:scale-125 ease-in-out duration-300"
            style={{ aspectRatio: '1/1', width: '65px', height: '65px' }}
          />
        </div>
        <p className="text-light-1 mt-2">{chatName}</p>
      </div>

      {/* Online Status on top right */}

        <div className="mr-2">
          {active ? (
              <div className="flex items-center gap-1">
              <p className="text-light-1">online</p> 
              <div className="online-dot online " />
              </div>
            ) : (
              <div className="flex items-center gap-1">
              <p className="text-light-1">offline</p> 
              <div className="online-dot offline " />
              </div>
            )}
        </div>

    </div>

    {/* Messages area with scroll */}

    <div className="flex-1 max-h-[60vh] overflow-y-auto p-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`mb-2 ${
          message.sender !== userID ?  
          `text-light-1 bg-gray-1 rounded-xl p-2 ${
            message.text.length < 30
              ? `max-w-[15ch]`
              : 'max-w-[30ch]'
          } overflow-wrap-break-word`
            :
            `text-light-1 bg-primary-500 rounded-xl p-2 ml-auto ${
                message.text.length < 30
                  ? `max-w-[15ch]`
                  : 'max-w-[30ch]'
              } overflow-wrap-break-word`
          }`
        
        }
        >
          {message.text}
        </div>
        
      ))}

       {read && (
        <div className="ml-auto w-6 mr-6">
          <p className="text-light-1">Read</p>
        </div>
      )}

      {didSend && !read && messages[messages.length - 1].sender === userID &&(
        <div className="ml-auto w-6 mr-12">
        <p className="text-light-1">Delivered..</p>
      </div>
      )}

      <div ref={messageEndRef}></div>
    </div>
  

    {/* Input area with send button */}
    <Form {...form}>
      <form className='chat-form p-2' onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name='message'
          render={({ field }) => (
                <FormItem className='flex w-full flex-col gap-3'>
                  <FormControl>
                    <Input
                      type='text'
                      className='account-form_input no-focus'
                      placeholder="Text Messages..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        <Button type='submit' className='comment-form_btn'>
          {!loading? <h1>Send</h1> : <Image src={"/assets/lineloader.svg"} alt="loading" width={44} height={34}/> }
        </Button>
      </form>
    </Form>
  </section>
  )
}

export default Chat