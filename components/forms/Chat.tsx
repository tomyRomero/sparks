"use client"

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
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
import Link from "next/link";

interface ChatMessage {
    text: string;
    sender: string;
    receiver: string;
    timestamp: string;
}

interface ChatProps {
    chatPicture: string;
    chatName: string;
    chatMessages: ChatMessage[];
    userID: string;
    receiver: string;
    isRead: boolean;
}

const Chat = ({ chatPicture, chatName, chatMessages, userID, receiver, isRead }: ChatProps) => {
    const [img, setImg] = useState("/assets/imgloader.svg");
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>(chatMessages);
    const messageEndRef = useRef<HTMLInputElement>(null);
    const [read, setRead] = useState(false);
    const [active, setActive] = useState(false);
    const [didSend, setDidSend] = useState(false);

    const pathname = usePathname();
    const router = useRouter();

    const { setGlobalMessages, readMessages, setReadMessages, pusherChannel } = useAppContext();

    useEffect(() => {
        const channel = pusherChannel;

        channel.bind('updateOnlineStatus', (data: any) => {
            if (data.userId === receiver) {
                setActive(true);
            }
        });

        channel.bind('message', (data: any) => {
            setGlobalMessages((prevGlobalMessages: any) => [...prevGlobalMessages, data]);

            if ((data.sender === userID && data.receiver === receiver) || (data.sender === receiver && data.receiver === userID)) {
                setRead(false);
                setMessages((prevMessages) => [...prevMessages, data]);
            }
        });

        channel.bind('updateReadStatus', (data: any) => {
            if (data.sender === userID && data.receiver === receiver) {
                setRead(true);
            }
        });

        return () => {
            channel.unbind('message');
            channel.unbind('updateReadStatus');
        };
    }, [chatMessages, setMessages, loading, setLoading]);

    useEffect(() => {
        const readChat = async () => {
            try {
                const lastMessage = messages[messages.length - 1];

                if (lastMessage.sender !== userID) {
                    const read = await markChatAsRead(receiver, userID, messages, pathname);
                    setReadMessages(!readMessages);
                }
            } catch (error) {
                console.log(error);
            }
        };

        readChat();
    }, [read]);

    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (isRead && lastMessage.sender === userID && lastMessage.receiver === receiver) {
                setRead(true);
            }
        }

        const loadChatImage = async () => {
            setImg(await getRes(chatPicture));
        };

        loadChatImage();
    }, []);

    const scrollTobottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollTobottom();
    }, [messages]);

    const form = useForm<z.infer<typeof messageValdiation>>({
        resolver: zodResolver(messageValdiation),
        defaultValues: {
            message: "",
        },
    });

    const onSubmit = async (data: { message: string }) => {
        setRead(false);
        setLoading(true);

        const timestamp = getDateTime();

        const newMessages = [
            ...messages,
            { text: data.message, sender: userID, receiver: receiver, timestamp: timestamp },
        ];

        const didSend = await sendMessage(data.message, userID, timestamp, receiver, newMessages, pathname);
        const didUpdate = await updateChatForOther(receiver, userID, newMessages, pathname);

        if (didSend) {
            setDidSend(true);
        }

        setLoading(false);
        form.setValue("message", "");
    };

    const goBack = () => {
        router.push("/chat");
    };

   // regex to extract messages that are shares from the home page
   const linkRegex = /Check Out This Post! (https?:\/\/\S+)/;

    return (
        <section className="w-full h-[80vh] flex flex-col bg-black rounded-xl overflow-hidden">
            <div className="flex items-center p-2 border-b-2 border-primary-500 bg-primary-500">
                <Button onClick={goBack} className='bg-transparent hover:bg-transparent hover:scale-125 ease-in-out duration-300'>
                    <Image src={"/assets/back.svg"} alt="loading" width={30} height={30} />
                </Button>
                <div className="flex flex-col items-center mx-auto cursor-pointer relative">
                    <div className="relative rounded-full overflow-hidden">
                        <Image
                            src={img}
                            alt={`Chat with ${chatName}`}
                            width={40}
                            height={40}
                            className="rounded-full object-contain hover:scale-125 ease-in-out duration-300 aspect-[1/1]"
                        />
                    </div>
                    <p className="text-light-1 mt-2">{chatName}</p>
                </div>
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
            <div className="flex-1 max-h-[60vh] overflow-y-auto p-4">
             
            {messages.map((message, index) => {
              //Conditonally render messages based on whether they are regular text messages or links that are being shared from users
                let match = linkRegex.exec(message.text);
                if (match) {
                    const link = match[1];
                    console.log("link: ", link);
                    return (
                        <div
                            key={index}
                            className={`mb-2 hover:bg-cyan-400 hover:underline hover:text-blue ${
                                message.sender !== userID
                                    ? `text-light-1 bg-gray-1 rounded-xl p-2 ${
                                          message.text.length < 30 ? `max-w-[15ch]` : 'max-w-[30ch]'
                                      } overflow-wrap-break-word`
                                    : `text-light-1 bg-primary-500 rounded-xl p-2 ml-auto ${
                                          message.text.length < 30 ? `max-w-[15ch]` : 'max-w-[30ch]'
                                      } overflow-wrap-break-word`
                            }`}
                        >
                            <Link href={link} target="_blank">
                                {message.text}
                            </Link>
                        </div>
                    );
                } else {
                    return (
                        <div
                            key={index}
                            className={`mb-2 ${
                                message.sender !== userID
                                    ? `text-light-1 bg-gray-1 rounded-xl p-2 ${
                                          message.text.length < 30 ? `max-w-[15ch]` : 'max-w-[30ch]'
                                      } overflow-wrap-break-word`
                                    : `text-light-1 bg-primary-500 rounded-xl p-2 ml-auto ${
                                          message.text.length < 30 ? `max-w-[15ch]` : 'max-w-[30ch]'
                                      } overflow-wrap-break-word`
                            }`}
                        >
                            {message.text}
                        </div>
                    );
                }
            })}
                {read && (
                    <div className="ml-auto w-6 mr-6">
                        <p className="text-light-1">Read</p>
                    </div>
                )}
                {didSend && !read && messages[messages.length - 1].sender === userID && (
                    <div className="ml-auto w-6 mr-12">
                        <p className="text-light-1">Delivered..</p>
                    </div>
                )}
                <div ref={messageEndRef}></div>
            </div>
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
                        {!loading ? <h1>Send</h1> : <Image src={"/assets/lineloader.svg"} alt="loading" width={44} height={34} />}
                    </Button>
                </form>
            </Form>
        </section>
    );
};

export default Chat;
