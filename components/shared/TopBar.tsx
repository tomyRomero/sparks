"use client"

import Link from "next/link";
import Image from "next/image";
import { SignOutButton, SignedIn} from "@clerk/nextjs";
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from "react";
import { useAppContext } from "@/lib/AppContext";
import { getChatBySenderAndReceiver, getChatsWithUsersByUserId } from "@/lib/actions/chat.actions";
import { fetchUser } from "@/lib/actions/user.actions";

function Topbar()
{
    const pathname = usePathname();

    const [noti, setNoti] = useState(false);

    const { userId, setUserId, globalMessages, setGlobalMessages, readMessages, setReadMessages} = useAppContext();

    const getNoti = async () => {
        const userChats = await getChatsWithUsersByUserId(userId);
    
        const readStatusArray = await Promise.all(
          userChats.map(async (chat) => {
            const senderID = chat.sender_id;
            const receiverID = chat.receiver_id;
    
            const chatfromOtherSide = await getChatBySenderAndReceiver(receiverID, senderID);
            const user = await fetchUser(receiverID)

            const lastMessage = chatfromOtherSide.messages[ chatfromOtherSide.messages.length - 1]

            if(lastMessage.receiver === user.id)
            {
              return 1;
            }else{
              return chatfromOtherSide.read_status;
            }
          })
        );
    
        console.log("Read Status Array: ", readStatusArray);
    
        // Check if readStatusArray contains 0 (unread)
        const hasUnreadChat = readStatusArray.includes(0);
    
        // Now you can use hasUnreadChat to determine if there is at least one unread chat
        if (hasUnreadChat) {
          // There is at least one unread chat
          console.log("There is at least one unread chat");
          setNoti(true);
        } else {
          // All chats are read
          console.log("All chats are read");
          setNoti(false);
        }
      };
    

    useEffect( ()=> {

        try {
            getNoti();

        }catch(error)
        {
            console.log(error)
        }

    }, [globalMessages, setGlobalMessages, readMessages, setReadMessages, userId])

    const isActive = () => {
        return pathname.includes("/chat")
    }

    const router = useRouter();
    return(
        <nav className="topbar">
            <Link href="/" className="flex items-center gap-4">
             <Image src="/assets/logo.svg"
             alt="logo"
             width={28}
             height={28}
             />
            <p className="font-agbalumo text-heading3-bold"><span className="teal_gradient">SPARKS</span></p>
            </Link>

            <div className={`md:hidden lg:hidden xl:hidden flex ml-auto hover:bg-primary-500 rounded-lg p-1 mr-2 ${isActive() ? 'bg-primary-500 ' : ''}`}>
            <Link
            href={"/chat"}
            >
                <div className={`${noti ? 'flex' : ''}`}>
            <Image 
                src="/assets/message.svg"
                alt="Chat Picture"
                width={34}
                height={34}
            />

            {noti && (
                  <Image 
                  src={"/assets/alert.svg"}
                  alt={"alert"}
                  width={20}
                  height={20}
              />
            )}
                </div>    
            
            </Link>
            </div>



            <div className="md:hidden">
                <SignedIn>
                    <SignOutButton signOutCallback={
                        ()=> router.push('/sign-in')
                    }>
                    <div className= "flex cursor-pointer gap-2 p-1 rounded-lg hover:bg-primary-500">
                        <Image 
                            src="/assets/logout.svg"
                            alt="logout"
                            width={34}
                            height={34}/>
                        </div>
                   </SignOutButton>
                </SignedIn>
            </div>
        </nav>
    )
}

export default Topbar;