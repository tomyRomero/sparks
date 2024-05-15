"use client"

import Link from "next/link";
import Image from "next/image";
import { SignOutButton, SignedIn} from "@clerk/nextjs";
import { useRouter, usePathname } from 'next/navigation'
import {  useEffect, useState } from "react";
import { useAppContext } from "@/lib/AppContext";
import React from "react";
import { getNoti} from "@/lib/actions/chat.actions";


function Topbar({ userId } : any)
{
    const pathname = usePathname();

    const { globalMessages, readMessages, setMessageNoti , messageNoti } = useAppContext();  
    
    useEffect(() => {
      const fetchData = async () => {
        try {
            setMessageNoti(await getNoti(userId))
        
        } catch (error) {
          console.log(error);
        }
      };
    
      fetchData(); 
    }, [globalMessages, readMessages]);
    

    
    const isActive = () => {
        return pathname.includes("/chat")
    }

    const router = useRouter();

    return(
        <nav className="topbar">
            <Link href="/" className="flex items-center gap-4">
             <Image src="/assets/logo.svg"
             alt="logo"
             width={38}
             height={38}
             />
            <p className="font-agbalumo text-heading2-bold"><span className="teal_gradient">SPARKS</span></p>
            </Link>

            <div className={`md:hidden lg:hidden xl:hidden flex ml-auto hover:bg-primary-500 rounded-lg p-1 mr-2 ${isActive() ? 'bg-primary-500 ' : ''}`}>
            <Link
            href={"/chat"}
            >
            <div className={`${messageNoti ? 'flex' : ''}`}>
            <Image 
                src="/assets/message.svg"
                alt="Chat Picture"
                width={34}
                height={34}
            />

            {messageNoti && (
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

export default React.memo(Topbar);