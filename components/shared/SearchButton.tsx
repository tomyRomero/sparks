"use client"

import React from 'react'
import { Button } from '../ui/button'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const SearchButton = () => {
    const router = useRouter();

  return (
    <Button className='bg-black border border-black text-white hover:bg-transparent hover:text-black' 
    onClick={()=> {
      router.push('/search-post')
    }}>
      <div className='flex gap-1'>
      <Image 
      src="/assets/search.svg"
      alt="search icon"
      width={24}
      height={24}
      />
      Search Posts
      </div>
    </Button>
  )
}

export default SearchButton