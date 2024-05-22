"use client"

import React, { useState } from 'react'
import { Button } from '../ui/button'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import Link from 'next/link'

const SearchButton = ({user} : {user:boolean}) => {
    const router = useRouter();
    const [isHovered, setIsHovered] = useState(false);

  if(user)
    {
      return (

        <Button className='bg-black border border-black text-white hover:bg-transparent hover:text-black' 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={()=> {
          router.push('/search-post')
        }}>
          <div className='flex gap-1'>
          {isHovered ? 
          ( 
          <Image 
          src="/assets/searchblack.png"
          alt="search icon"
          width={24}
          height={24}
          />
        )
        : 
        ( <Image 
            src="/assets/search.png"
            alt="search icon"
            width={24}
            height={24}
        />
        )
        }
          Search Posts
          </div>
        </Button>
      )
    }else{
      return (
        <Dialog >
        <DialogTrigger asChild>
        <Button className='bg-black border border-black text-white hover:bg-transparent hover:text-black' 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
       >
          <div className='flex gap-1'>
          {isHovered ? 
          ( 
          <Image 
          src="/assets/searchblack.png"
          alt="search icon"
          width={24}
          height={24}
          />
        )
        : 
        ( <Image 
            src="/assets/search.png"
            alt="search icon"
            width={24}
            height={24}
        />
        )
        }
          Search Posts
          </div>
        </Button>
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
      )
    }
 
}

export default SearchButton