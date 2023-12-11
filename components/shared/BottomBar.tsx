"use client"

import { bottombarLinks } from "@/constants";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from "react";
import { useAppContext } from "@/lib/AppContext";
import { doesPostBelongToUser, fetchLikesAndCommentsByUser } from "@/lib/actions/user.actions";

function Bottombar({user} : any)
{
    const pathname = usePathname();
    const [activity, setActivity] = useState(false)

    const { pusherChannel, newComment, setNewComment, newLike, setNewLike, setReadActivity, readActivity} = useAppContext();
    const channel =  pusherChannel

    const getAcivityAtStartUp = async () => {
      const activity = await fetchLikesAndCommentsByUser(user.id, 5);

      // Check if any Activity has read_status === 1
      const hasUnreadPost = activity.some(activity => activity.read_status === 1);
      
      if(hasUnreadPost)
      {
        setActivity(true)
      }else{
        setActivity(false)
      }
    }

    useEffect(()=> {
      getAcivityAtStartUp();
    }, [readActivity, setReadActivity])

    useEffect( ()=> {
        try {
          //Look for realtime events on new notifactions from activity
          channel.bind('comment', async (data: any) => {
            
            // Handle new comment received from Pusher
  
            const myPost = await doesPostBelongToUser(data.postId, user.id)
            
            if(myPost)
            {
              setActivity(true);
            }
    
          });
    
        } catch (error) {
          console.error(error);
        }
  
      }, [newComment, setNewComment])
  
    useEffect(()=> {
  
        //Look for Real time updates of Likes
        channel.bind('like', async (data: any) => {
            
          // Handle new comment received from Pusher
  
          const myPost = await doesPostBelongToUser(data.postId, user.id)
          
          if(myPost)
          {
            setActivity(true);
          }
        });
  
      }, [newLike, setNewLike])

    return(
        <section className="bottombar">
            <div className="bottombar_container">
            {
                bottombarLinks.map((link: any)=> {
                const isActive = (pathname.includes(link.route) && link.route.length > 1)
                || pathname === link.route;

                    return(
                    
                    <Link 
                    href={`${link.route === '/profile' ? `/profile/${user.id}` : `${link.route}`}`}
                    key={link.label}
                    className={`bottombar_link ${ isActive && 'bg-primary-500'}`}
                    >
                        <div className={`${activity ? 'flex' : ''}`}>
                        <Image 
                        src={link.imgURL}
                        alt={link.label}
                        width={24}
                        height={24}
                        />

                        {activity && link.label === "Activity" && (
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
}

export default Bottombar;