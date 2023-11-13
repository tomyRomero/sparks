"use client"

import { sidebarLinks, bottombarLinks } from "@/constants";
import Link from "next/link";
import Image from "next/image";
import { redirect, usePathname, useRouter } from 'next/navigation'
import { SignOutButton, SignedIn, currentUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { fetchUser } from "@/lib/actions/user.actions";
import { getImageData } from "@/lib/s3";

function LeftSidebar({user} : any)
{

    const [img, setImg] = useState('/assets/profile.svg');

    const router = useRouter();
    const pathname = usePathname();

    const isActive = (link : any) => {
        return (pathname.includes(link.route) && link.route.length > 1)
                         || pathname === link.route;
    }

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

    return(
        <section className="custom-scrollbar leftsidebar">
            <div className="flex w-full flex-1 flex-col gap-6 px-9">
                {
                    
                    sidebarLinks.map(( link)=> {
                        const isActive = (pathname.includes(link.route) && link.route.length > 1)
                         || pathname === link.route;

                         //if(link.route === '/profile') link.route = `${link.route}/${userId}`

                        return(
                        <Link 
                        href={link.route}
                        key={link.label}
                        className={`leftsidebar_link hover:bg-primary-500 ${ isActive && 'bg-primary-500'}`}
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
                        </Link>
                        )}
                    )}    
            </div>
            
           
            <div className="flex items-center justify-center p-2 space-x-4 ">
            <Link
            href={bottombarLinks[4].route}
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
