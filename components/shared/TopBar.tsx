"use client"

import Link from "next/link";
import Image from "next/image";
import { SignOutButton, SignedIn} from "@clerk/nextjs";
import { useRouter, usePathname } from 'next/navigation'
import {  useEffect, useState } from "react";
import { useAppContext } from "@/lib/AppContext";
import React from "react";
import { getNoti} from "@/lib/actions/chat.actions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";


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

    if(userId !== "null" )
        {

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
                        ()=> router.push('/')
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
        else{
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
                <Dialog >
                <DialogTrigger asChild>
                <div className={`cursor-pointer md:hidden lg:hidden xl:hidden flex ml-auto hover:bg-primary-500 rounded-lg p-1 mr-2 ${isActive() ? 'bg-primary-500 ' : ''}`}>
               

                <Image 
                    src="/assets/message.svg"
                    alt="Chat Picture"
                    width={34}
                    height={34}
                />
                    
                </div>                
                </DialogTrigger>
                <DialogContent className="rounded-xl xs:max-w-[400px] sm:max-w-[425px]">
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
      </Dialog>
            </nav>
            )
        }

}

export default React.memo(Topbar);