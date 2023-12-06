"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, useRef} from "react";
import { useForm } from "react-hook-form";
import { boolean, z } from "zod";
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
import { markChatAsRead, sendMessage, updateChatForOther, updateOnlineStatus } from "@/lib/actions/chat.actions";
import { usePathname, useRouter } from "next/navigation";
import { getImageData } from "@/lib/s3";
import pusherClient from "@/lib/pusher";

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

  const pathname = usePathname();
  const router = useRouter();

  var pusher = pusherClient;

  useEffect(() => {
    try {
      const channel = pusher.subscribe('sparks');

       // Handle the event for updating the online status
      channel.bind('updateOnlineStatus', (data: any) => {
        // Handle updating the online status of the user
        // Use the data to update the online status in UI
        console.log('Received updateOnlineStatus event:', data);
        setActive(true);
      });

      channel.bind('message', (data: any) => {
        // Handle new message received from Pusher

        // Update the state with the new message if the sender ID and reciever ID match
        
        console.log("MESSAGE DATA: ", data)

        if(data.sender === userID && data.receiver === receiver || data.sender === receiver && data.receiver === userID)
        {
          setMessages((prevMessages) => [...prevMessages, data]);
          const newArr = [...messages, data]
          console.log("New Message", newArr) 
        }

      });
  
    // Handle the event for updating the read status
    channel.bind('updateReadStatus', (data: any) => {
      // Handle updating the read status of the messages
      // Filter and update the messages based on the data received
      console.log('Received updateReadStatus event:', data);

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
        channel.unbind('updateOnlineStatus');
        pusher.unsubscribe('chats');
      };

    } catch (error) {
      console.error(error);
    }
  }, [chatMessages, setMessages]);

  useEffect ( ()=> {
    try{
      //Function that updates the readStatus of the Chat and also uses Pusher
      const lastMessage = messages[messages.length - 1]
    
      if(lastMessage.sender !== userID && lastMessage.receiver === userID)
      {
        markChatAsRead(receiver, userID, messages, pathname);
      }
      
    }
    catch(error){
      console.log(error);
    }
  }, [read])

  useEffect( ()=> {

    if(messages.length > 0)
    {
      const lastMessage = messages[messages.length - 1]
      
      if(isRead && lastMessage.sender === userID && lastMessage.receiver === receiver)
      {
        setRead(true);
      }

    }

    const loadChatImage = async ()=> {
      let imgResult = "/assets/profile.svg"
  
      if (chatPicture.startsWith('user')) {
        const res = await getImageData(chatPicture);
        imgResult = res;
      } else {
        imgResult = chatPicture;
      }
      setImg(imgResult)
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
    
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: 'numeric', hour12: true };
    
    const timestamp = new Intl.DateTimeFormat('en-US', options).format(date);
    
    // Call the sendMessage function with the entered message and sender

    const newMessages = [
      ...messages,
      { text: data.message, sender: userID, receiver: receiver, timestamp: timestamp },
    ]

    //Send to Pusher and also save to Database
    sendMessage(data.message, userID, timestamp, receiver, newMessages, pathname);
    updateChatForOther(receiver, userID, newMessages, pathname);

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