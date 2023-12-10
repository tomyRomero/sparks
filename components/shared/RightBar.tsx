"use client"

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ChatLogs from "../cards/ChatLogs";
import { useEffect } from "react";
import { useAppContext } from "@/lib/AppContext";


function RightBar({chats} : any)
{
    const pathname = usePathname();
    const router = useRouter();

    const isActive = () => {
        return pathname.includes("/chat")
    }

    return(
        <section className={`custom-scrollbar rightsidebar ${isActive()? 'hidden': ''}`}>
            <div className="flex flex-1 flex-col justify-start w-72">
                <Link
                href={"/chat"}
                >
                <div className="flex gap-4 mx-auto w-40 hover:bg-primary-500 p-4 rounded-lg">
                    <h3 className="text-heading4-medium text-light-1 cursor-pointer">Recent Chats..</h3>
                    <Image 
                        src={"/assets/message.svg"}
                        alt="Message Picture"
                        width={28}
                        height={28}
                        className="justify-end"
                    />
                </div>
                </Link>
                <div className="w-48 mx-auto m-1 p-1 border-b-2 border-white" />
                <div className="p-4 flex flex-col overflow-y-auto overflow-hidden">
                    {chats.length === 0 ? (
                    <h3 className="text-left mt-2 text-light-1">No Recent Chats... Click Above To Get Started or Go to Messages Tab</h3>
                    ): (
                    <>
                    {chats.map((chat: any) => (
                        <div 
                        key= {chat.receiver_id}
                        className="bg-white rounded-lg hover:bg-cyan-500  mb-4"
                        >
                        <ChatLogs chatRead={chat.read_status} senderID={chat.sender_id} receiverID={chat.receiver_id} chatMessages={chat.messages} receiverPicture={chat.user_image} chatName={chat.user_username} isHome={true} path={pathname}/>
                        </div>
                    ))}
                    </>
                )}
                </div>
            </div>
            
        </section>
    )
}

export default RightBar;