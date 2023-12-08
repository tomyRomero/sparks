"use client"

import { sidebarLinks, bottombarLinks } from "@/constants";
import Link from "next/link";
import Image from "next/image";
import { redirect, usePathname, useRouter } from 'next/navigation'
import { SignOutButton, SignedIn, currentUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { fetchUser } from "@/lib/actions/user.actions";
import { getImageData } from "@/lib/s3";
import { getChatBySenderAndReceiver, getChatsWithUsersByUserId, revalData } from "@/lib/actions/chat.actions";
import pusherClient from "@/lib/pusher";
import { useAppContext } from "@/lib/AppContext";

function LeftSidebar({user} : any)
{

    const [img, setImg] = useState('/assets/profile.svg');
    const [noti, setNoti] = useState(false);

    const { globalMessages, setGlobalMessages, readMessages, setReadMessages} = useAppContext();

    var pusher = pusherClient;
    const router = useRouter();
    const pathname = usePathname();

    const isActive = (link : any) => {
        return (pathname.includes(link.route) && link.route.length > 1)
                         || pathname === link.route;

    }

    const getNoti = async () => {
        const userChats = await getChatsWithUsersByUserId(user.id);
    
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
    

    useEffect( () => {
        const load = async () => {
          try{
            if(user.image.startsWith('user'))
            {
                const res = await getImageData(user.image);
                if(res)
                {
                setImg(res);
                }
            }else{
                setImg(user.image)
            }
          }catch(error)
          {
            console.log("Error" , error)
          }
        }
  
        load();
  
      }, [])

      useEffect(() => {
        getNoti();
      }, [noti]);


      useEffect(()=> {
        try {
            const channel = pusher.subscribe('sparks');
            console.log("Left Bar Pusher Active: ")

            channel.bind('message', (data: any) => {
                // Handle new message received from Pusher
        
                if(data.sender === user.id || data.receiver === user.id)
                {
                    getNoti();
                }
              });

              // Handle the event for updating the read status
              channel.bind('updateReadStatus', (data: any) => {
                // Handle updating the read status of the messages
                // Filter and update the messages based on the data received
                console.log('Left Bar updateReadStatus event:', data);

                // Check if the current user is the sender of the message

                if(data.sender === user.id || data.receiver === user.id)
                {
                    getNoti();
                }
               
              });

              return () => {
                channel.unbind('message');
                channel.unbind("updateReadStatus")
                pusher.unsubscribe('chats');
              };


        }catch(error)
        {
            console.log(error)
        }
      
      }, [globalMessages, setGlobalMessages, readMessages, setReadMessages])


      

    return(
        <section className="custom-scrollbar leftsidebar">
            <div className="flex w-full flex-1 flex-col gap-6 px-9">
                {
                    
                    sidebarLinks.map(( link)=> {
                        const isActive = (pathname.includes(link.route) && link.route.length > 1)
                         || pathname === link.route;

                         if(link.route === '/profile') link.route = `${link.route}/${user.id}`

                        return(
                        <Link 
                        href={link.route}
                        key={link.label}
                        className={`leftsidebar_link hover:bg-primary-500 ${isActive && 'bg-primary-500'}`}
                        >
                            <Image 
                            src={link.imgURL}
                            alt={link.label}
                            width={25}
                            height={25}
                            />
                            <p className="text-light-1 max-lg:hidden">
                            {link.label}
                            {
                            noti && link.label === "Message" && (
                            <div className="inline-block">
                            <Image 
                                src={"/assets/alert.svg"}
                                alt={"alert"}
                                width={20}
                                height={20}
                            />
                            </div>
                            )
                            }
                            </p>
                        </Link>
                        )}
                    )}    
            </div>
            
            <div className="flex items-center justify-center p-2 space-x-4 ">
            <Link
            href={`${bottombarLinks[4].route}/${user.id}`}
            key={bottombarLinks[4].label}
            className={`leftsidebar_link hover:bg-primary-500 ${ isActive(bottombarLinks[4]) && 'bg-primary-500'}`}
            >
                <img src={img} alt="Profile Pic" className="w-12 h-12 rounded-full dark:bg-gray-500" />
                <div>
                    <h2 className="text-light-1 max-lg:hidden">{user? user.name: 'Sparkify User'}</h2>
                    <span className="flex items-center space-x-1 max-lg:hidden">
                        <Image 
                        src={bottombarLinks[4].imgURL}
                        alt={bottombarLinks[4].label}
                        width={20}
                        height={20}
                        />
                        <p className="hover:underline  text-light-1 max-lg:hidden">View profile</p>
                    </span>
                </div>
                </Link>
            </div>
            
            

            <div className="mt-5 px-6">
                <SignedIn>
                    <SignOutButton signOutCallback={
                        ()=> router.push('/sign-in')
                    }>
                    <div className= "flex cursor-pointer gap-4 p-4 rounded-lg hover:bg-primary-500">
                        <Image 
                            src="/assets/logout.svg"
                            alt="logout"
                            width={24}
                            height={24}/>
                            <p className="text-light-2 max-lg:hidden">Logout</p>
                        </div>
                   </SignOutButton>
                </SignedIn>
            </div>
        </section>
    )
}

export default LeftSidebar;
