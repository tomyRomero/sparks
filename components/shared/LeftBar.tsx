"use client"

import { sidebarLinks, bottombarLinks } from "@/constants";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from 'next/navigation'
import { SignOutButton, SignedIn } from "@clerk/nextjs";
import {  SVGProps, useEffect, useState } from "react";
import { fetchUser, doesPostBelongToUser, fetchLikesAndCommentsByUser } from "@/lib/actions/user.actions";
import { getRes } from "@/lib/s3";
import { useAppContext } from "@/lib/AppContext";
import React from "react";
import NavLoginmodal from "./NavLoginModal";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";

function LeftSidebar({userid}: any)
{
    const [name, setName] = useState(null);
    const [img, setImg] = useState('/assets/profile.svg');

    const {pusherChannel, newComment, newLike, readActivity, messageNoti , activityNoti , setActivityNoti} = useAppContext();

    const router = useRouter();
    const pathname = usePathname();
    const channel =  pusherChannel

    const isActive = (link : any) => {
        return (pathname.includes(link.route) && link.route.length > 1)
                         || pathname === link.route;

    }

    const getAcivityAtStartUp = async () => {
      const results = await fetchLikesAndCommentsByUser(userid, 40, 1, 8);

      // Check if any Activity has read_status === 1
      const hasUnreadPost = results.activity.some(activity => activity.read_status === 1);
      
      if(hasUnreadPost)
      {
        setActivityNoti(true)
      }
    }

    useEffect( ()=> {
      try {
        //Look for realtime events on new notifactions from activity
        channel.bind('comment', async (data: any) => {
          
          // Handle new comment received from Pusher

          const myPost = await doesPostBelongToUser(data.postId, userid)
          
          if(myPost)
          {
            setActivityNoti(true);
          }
  
        });
  
      } catch (error) {
        console.error(error);
      }

    }, [ newComment])

    useEffect(()=> {

      //Look for Real time updates of Likes
      channel.bind('like', async (data: any) => {
          
        // Handle new like received from Pusher

        const myPost = await doesPostBelongToUser(data.postId, userid)
        
        if(myPost)
        {
          setActivityNoti(true);
        }
      });

    }, [newLike])
 
    useEffect( () => {
        const load = async () => {
          try{
            const userDb = await fetchUser(userid);
            setName(userDb.name)
            setImg(await getRes(userDb.image))
          }catch(error)
          {
            console.log("Error" , error)
          }
        }
        load();
      }, [])

      useEffect(()=> {
       getAcivityAtStartUp();
      }, [readActivity])

    if(userid !== "null")
      {
        return(
          <section className="custom-scrollbar leftsidebar">
              <div className="mt-3 flex w-full flex-1 flex-col gap-6 px-14">
                  {
                      sidebarLinks.map(( link)=> {
                          const isActive = (pathname.includes(link.route) && link.route.length > 1)
                           || pathname === link.route;
  
                           if(link.route === '/profile') link.route = `${link.route}/${userid}`
  
                          return(
                          <Link 
                          href={link.route}
                          key={link.label}
                          className={`leftsidebar_link hover:bg-primary-500 ${isActive && 'bg-primary-500'}`}
                          >
                        
                              <Image 
                              src={link.imgURL}
                              alt={link.label}
                              width={35}
                              height={35}
                              />
                              <p className="self-center text-light-1 max-lg:hidden">
                              {link.label}
                              </p>
                              {
                              messageNoti && link.label === "Message" && (
                              <div className="self-center">
                              <Image 
                                  src={"/assets/alert.svg"}
                                  alt={"alert"}
                                  width={20}
                                  height={20}
                              />
                              </div>
                              )
                              }
                              {
                              activityNoti && link.label === "Activity" && (
                              <div className="self-center">
                              <Image 
                                  src={"/assets/alert.svg"}
                                  alt={"alert"}
                                  width={20}
                                  height={20}
                              />
                              </div>
                              )
                              }
                          </Link>
                          )}
                      )
                      
                      }    
              </div>
              
              <div className="flex items-center justify-center p-2 space-x-4 ">
              <Link
              href={`${bottombarLinks[4].route}/${userid}`}
              key={bottombarLinks[4].label}
              className={`leftsidebar_link hover:bg-primary-500 ${ isActive(bottombarLinks[4]) && 'bg-primary-500'}`}
              >
                  <Image src={img} alt="Profile Pic"
                  width={20}
                  height={20}
                  className="w-12 h-12 rounded-full aspect-[1/1]" />
                  <div>
                      <h2 className="text-light-1 max-lg:hidden">{name ? name: 'Sparkify User'}</h2>
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
              
              <div className="mt-4 p-4 mx-auto max-lg:justify-center max-lg:p-2 max-lg:mx-auto">
                  <SignedIn>
                      <SignOutButton signOutCallback={
                          ()=> router.push('/')
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
    }else{
      return(
          <section className="custom-scrollbar leftsidebar">
              <div className="mt-3 flex w-full flex-1 flex-col gap-6 px-16 cursor-pointer">
                  {
                      sidebarLinks.map((link)=> {
                          const isActive = (pathname.includes(link.route) && link.route.length > 1)
                           || pathname === link.route;
  
                          return(
                          <div
                          className={`relative flex justify-start gap-4 rounded-xl p-2.5 max-lg:gap-1 max-lg:justify-center hover:bg-primary-500 ${isActive && 'bg-primary-500'}`}
                          >
                            <NavLoginmodal image={link.imgURL} label={link.label} />
                          </div>
                          )}
                      )

                      }    
              </div>
              
              <div className="flex items-center justify-center p-2 space-x-4 mb-10 cursor-pointer">
              <Dialog >
              <DialogTrigger asChild>
              <div
              className={`leftsidebar_link hover:bg-primary-500`}
              >
                  <Image src={img} alt="Profile Pic"
                  width={20}
                  height={20}
                  className="w-12 h-12 rounded-full aspect-[1/1]" />
                  <div>
                      <h2 className="text-light-1 max-lg:hidden">{name ? name: 'Guest'}</h2>
                      <span className="flex items-center space-x-1 max-lg:hidden">
                          <Image 
                          src={bottombarLinks[4].imgURL}
                          alt={bottombarLinks[4].label}
                          width={20}
                          height={20}
                          />
                          <p className="hover:underline  text-light-1 max-lg:hidden">Login profile</p>
                      </span>
                  </div>
                  </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
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
              </div>
              
          </section>
      )
    }
 
}


export default React.memo(LeftSidebar);
