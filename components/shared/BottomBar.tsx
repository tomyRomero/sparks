"use client"

import { bottombarLinks } from "@/constants";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from 'next/navigation'
import React from "react";
import { useAppContext } from "@/lib/AppContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";

function Bottombar({userid}: any)
{
    const pathname = usePathname();

    const {activityNoti, pusherChannel } = useAppContext();
    const channel =  pusherChannel

    if( userid !== "null"){
        return(
            <section className="bottombar">
                <div className="bottombar_container">
                {
                    bottombarLinks.map((link: any)=> {
                    const isActive = (pathname.includes(link.route) && link.route.length > 1)
                    || pathname === link.route;
    
                        return(
                        
                        <Link 
                        href={`${link.route === '/profile' ? `/profile/${userid}` : `${link.route}`}`}
                        key={link.label}
                        className={`bottombar_link ${ isActive && 'bg-primary-500'}`}
                        >
                            <div className={`${activityNoti ? 'flex' : ''}`}>
                            <Image 
                            src={link.imgURL}
                            alt={link.label}
                            width={24}
                            height={24}
                            />
    
                            {activityNoti && link.label === "Activity" && (
                                <Image 
                                    src={"/assets/alert.svg"}
                                    alt={"alert"}
                                    width={20}
                                    height={20}
                                />
                            )}
                            </div>
    
                            <p className="text-subtle-medium text-light-1 max-sm:hidden">
                                {link.label.split(/\s+/)[0]}
                                
                            </p>
                            
                        </Link>
                        )}
                    )} 
                </div>
            </section>
        )
    }else{
        return(
            <section className="bottombar">
                <div className="bottombar_container">
                {
                    bottombarLinks.map((link: any)=> {
                    const isActive = (pathname.includes(link.route) && link.route.length > 1)
                    || pathname === link.route;
                        
                        if(link.label === "Home")
                        {
                            return(
                            <Link href="/" className={`bottombar_link ${ isActive && 'bg-primary-500'} cursor-pointer hover:bg-primary-500`}>
                            <div>
                            <Image 
                            src={link.imgURL}
                            alt={link.label}
                            width={24}
                            height={24}
                            />
                            </div>
    
                            <p className="text-subtle-medium text-light-1 max-sm:hidden">
                                {link.label.split(/\s+/)[0]}
                            </p>
                            </Link>
                            )
                        }else{
                        return(
                        <Dialog >
                        <DialogTrigger asChild>
                        <div 
                        key={link.label}
                        className={`bottombar_link ${ isActive && 'bg-primary-500'} cursor-pointer hover:bg-primary-500`}
                        >
                            <div>
                            <Image 
                            src={link.imgURL}
                            alt={link.label}
                            width={24}
                            height={24}
                            />
                            </div>
    
                            <p className="text-subtle-medium text-light-1 max-sm:hidden">
                                {link.label.split(/\s+/)[0]}
                            </p>
                            
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
                                                />
                                    Create Account
                                    </Button>
                                    </Link>
                                </div>
                                </div>
                            </DialogContent>
                            </Dialog>
                        )}
                    }
                    )} 
                </div>
            </section>
        ) 
    }
   
}

export default React.memo(Bottombar);