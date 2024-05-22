"use client"

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ChatLogs from "../cards/ChatLogs";
import { useEffect, useState } from "react";
import { useAppContext } from "@/lib/AppContext";
import { getChatsWithUsersByUserId } from "@/lib/actions/chat.actions";
import React from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";


function RightBar({userid}: any)
{
    const [chats, setChats] =  useState<any[]>([]);

    const pathname = usePathname();
    const router = useRouter();

    const { setGlobalMessages, globalMessages, setReadMessages, readMessages} = useAppContext();

    const [page, setPage] = useState(0);
    const itemsPerPage = 4;
  
    const startIndex = page * itemsPerPage;
    const slicedChats = chats.slice(startIndex, startIndex + itemsPerPage);
  
    const addNewValue = () => {
      setPage((prevState) => prevState + 1);
    };
  
    const subtractNewValue = () => {
      setPage((prevState) => Math.max(0, prevState - 1));
    };
  
    const handleNavigation = (type: string) => {
      if (type === 'prev') {
        subtractNewValue();
      } else if (type === 'next') {
        addNewValue();
      }
    };

    const isActive = () => {
        return pathname.includes("/chat")
    }

    useEffect(()=> {
        const getChats = async ()=> {
            let chats: any[] = await getChatsWithUsersByUserId(userid)
            const sortedChats = chats.sort((chatA, chatB) => {
              const lastMessageA = chatA.messages[chatA.messages.length - 1];
              const lastMessageB = chatB.messages[chatB.messages.length - 1];
            
              const dateA = new Date(lastMessageA.timestamp);
              const dateB = new Date(lastMessageB.timestamp);
            
              // Compare the dates (descending order, latest time first)
              //@ts-ignore
              return dateB - dateA;
            });  
            
            if(sortedChats.length > 1)
            {
              chats = sortedChats;
            }

            setChats(chats)
        }
    
        getChats();
    }, [ setGlobalMessages, globalMessages, setReadMessages, readMessages])

    if(userid !== "null")
      {
        return(
          <section className={`custom-scrollbar h-screen rightsidebar ${isActive()? 'hidden': ''}`}>
              <div className="flex flex-1 flex-col justify-start w-72">
                  <Link
                  href={"/chat"}
                  >
                  <div className="mt-2 flex gap-4 mx-auto w-40 hover:bg-primary-500 px-4 py-2 rounded-lg">
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
                      {slicedChats.map((chat: any) => (
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
                  <div className="pagination">
                  <Button
                  onClick={() => handleNavigation('prev')}
                  disabled={page === 0}
                  className='!text-small-regular text-light-2 bg-primary-500'
                  >
                  Prev
                  </Button>
                  <p className='text-small-semibold text-light-2'>{page + 1}</p>
                  <Button
                  onClick={() => handleNavigation('next')}
                  disabled={startIndex + itemsPerPage >= chats.length}
                  className='!text-small-regular text-light-2 bg-primary-500'
                  >
                  Next
                  </Button>
              </div>
              </div>
              
          </section>
      )
      }
      //If user is not logged in, prompt them to make account
      else{
        return(
          <section className={`custom-scrollbar h-screen rightsidebar ${isActive()? 'hidden': ''}`}>
              <div className="flex flex-1 flex-col justify-start w-72">
              <Dialog >
              <DialogTrigger asChild>
                  <div className="mt-2 flex gap-4 mx-auto w-40 hover:bg-primary-500 px-4 py-2 rounded-lg">
                      <h3 className="text-heading4-medium text-light-1 cursor-pointer">Recent Chats..</h3>
                      <Image 
                          src={"/assets/message.svg"}
                          alt="Message Picture"
                          width={28}
                          height={28}
                          className="justify-end"
                      />
                  </div>
                  </DialogTrigger>
                  <DialogContent className="rounded-xl sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="text-heading3-bold">Welcome to Sparks!</DialogTitle>
                    <DialogDescription>Please login or create an account to continue.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                      <div className="flex gap-4">
                        <Link href="/sign-in" className="flex-grow">
                        <Button variant="outline" className="w-full flex items-center justify-center">
                          <Image 
                            src={"/assets/login.png"}
                            alt="login icon"
                            width={24}
                            height={24}
                            className="object-contain mr-2"
                                      />
                              Login
                          </Button>
                          </Link>
                          <Link href="/sign-up">
                          <Button className="w-full flex items-center justify-center">
                          <Image 
                            src={"/assets/plus.png"}
                            alt="login icon"
                            width={24}
                            height={24}
                            className="object-contain mr-2"
                            onClick={()=> {router.push('/sign-up')}}
                                      />
                            Create Account
                          </Button>
                          </Link>
                        </div>
                  </div>
                </DialogContent>
              
                  <div className="w-48 mx-auto m-1 p-1 border-b-2 border-white" />
                  <div className="p-4 flex flex-col overflow-y-auto overflow-hidden">
                  <DialogTrigger asChild>
                      <h3 className="text-center mt-2 text-light-1 cursor-pointer hover:underline">Login to See Recent Chats!</h3>
                      </DialogTrigger>
                  </div>
                  </Dialog >
                  <div className="pagination">
                  <Button
                  onClick={() => handleNavigation('prev')}
                  disabled={page === 0}
                  className='!text-small-regular text-light-2 bg-primary-500'
                  >
                  Prev
                  </Button>
                  <p className='text-small-semibold text-light-2'>{page + 1}</p>
                  <Button
                  onClick={() => handleNavigation('next')}
                  disabled={startIndex + itemsPerPage >= chats.length}
                  className='!text-small-regular text-light-2 bg-primary-500'
                  >
                  Next
                  </Button>
              </div>
              </div>

              
          </section>
          
        )
      }
    
}

export default React.memo(RightBar);



