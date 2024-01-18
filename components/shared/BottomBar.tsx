"use client"

import { bottombarLinks } from "@/constants";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from 'next/navigation'
import React, { useState, useEffect } from "react";
import { useAppContext } from "@/lib/AppContext";
import { doesPostBelongToUser, fetchLikesAndCommentsByUser } from "@/lib/actions/user.actions";

function Bottombar({userid}: any)
{
    const pathname = usePathname();

    const {activityNoti, pusherChannel, newComment, setNewComment, newLike, setNewLike, setReadActivity, readActivity} = useAppContext();
    const channel =  pusherChannel

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
}

export default React.memo(Bottombar);