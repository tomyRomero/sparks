"use client"

import React, { useState } from 'react'
import { Button } from '../ui/button'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const SearchButton = () => {
    const router = useRouter();
    const [isHovered, setIsHovered] = useState(false);

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
}

export default SearchButton