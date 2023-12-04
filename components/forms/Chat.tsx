"use client"

import Link from "next/link"
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
import Pusher from "pusher-js";
import { sendMessage, updateChatForOther } from "@/lib/actions/chat.actions";
import { fetchUser } from "@/lib/actions/user.actions";
import { usePathname } from "next/navigation";
import { getImageData } from "@/lib/s3";

interface chat{
    chatPicture: string;
    chatName: string;
    chatMessages: {
        text: string;
        sender: string;
        timestamp: string;
    }[];
    userID: string;
    receiver: string;
}

const Chat = ({chatPicture, chatName, chatMessages, userID, receiver}: chat) => {
  const [img, setImg] = useState("/assets/imgloader.svg")
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState(chatMessages);
  const messageEndRef = useRef<HTMLInputElement>(null);

  const pathname = usePathname();

  console.log("Sender: ", userID)
  console.log("Reciever: ", receiver)

  useEffect(() => {

    try {
      //@ts-ignore
      var pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY, {
        cluster: "us2",
      });
  
      const channel = pusher.subscribe('sparks');
      channel.bind('message', (data: any) => {
        // Handle new message received from Pusher

        // Update the state with the new message
        setMessages((prevMessages) => [...prevMessages, data]);

        const newArr = [...messages, data]
        console.log(newArr)
      });
  
      // Clean up on component unmount
      return () => {
        channel.unbind('message');
        pusher.unsubscribe('chats');
      };

    } catch (error) {
      console.error(error);
    }
  }, [chatMessages, setMessages]);

  useEffect( ()=> {
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

    setLoading(true)
    
    const timestamp = new Date().toLocaleTimeString()
    // Call the sendMessage function with the entered message and sender

    const newMessages = [
      ...messages,
      { text: data.message, sender: userID, timestamp: timestamp },
    ]

    //Send to Pusher and also save to Database
    sendMessage(data.message, userID, timestamp, receiver, newMessages, pathname);

    updateChatForOther(receiver, userID, newMessages, pathname);

    // Clear the form input after sending the message
    setLoading(false)
    form.setValue("message", "");
  };


  return (
    <section className="w-full h-[80vh] flex flex-col bg-black rounded-xl overflow-hidden">
    <div className="flex items-center p-2 border-b-2 border-primary-500">

      {/* Back button */}

      <div className="cursor-pointer">
        <Link
        href="/chat">
        <p className="text-light-1">Back</p>
        </Link>
      </div>

      {/* User details in the middle */}

      <div className="flex flex-col items-center ml-auto mr-auto">
        <div className="relative rounded-full overflow-hidden">
          <Image
            src={img}
            alt={`Chat with ${chatName}`}
            width={40}
            height={40}
            className="rounded-full object-contain"
          />
        </div>
        <p className="text-light-1 mt-2">{chatName}</p>
      </div>

      {/* Image bubble on top right */}

      <div className="relative rounded-full overflow-hidden">
        <Image
          src={img}
          alt={`Chat with ${chatName}`}
          width={40}
          height={40}
          className="rounded-full object-contain"
        />
      </div>
    </div>

    {/* Messages area with scroll */}

    <div className="flex-1 max-h-[60vh] overflow-y-auto p-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`mb-4 ${
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
      <div ref={messageEndRef}></div>
    </div>
  

    {/* Input area with send button */}
    <Form {...form}>
      <form className='comment-form p-4' onSubmit={form.handleSubmit(onSubmit)}>
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