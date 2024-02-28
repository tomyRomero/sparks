"use client"

import { sidebarLinks, bottombarLinks } from "@/constants";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from 'next/navigation'
import { SignOutButton, SignedIn } from "@clerk/nextjs";
import {  useEffect, useState } from "react";
import { fetchUser, doesPostBelongToUser, fetchLikesAndCommentsByUser } from "@/lib/actions/user.actions";
import { getRes } from "@/lib/s3";
import { useAppContext } from "@/lib/AppContext";
import React from "react";

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


    return(
        <section className="custom-scrollbar leftsidebar">
            <div className="flex w-full flex-1 flex-col gap-6 px-9">
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
                            width={25}
                            height={25}
                            />
                            <p className="text-light-1 max-lg:hidden">
                            {link.label}
                            </p>
                            {
                            messageNoti && link.label === "Message" && (
                            <div className="pt-0.5">
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
                            <div className="pt-0.5">
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
                    )}    
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

export default React.memo(LeftSidebar);
