import React from 'react'
import { currentUser } from '@clerk/nextjs';

const page = () => {

  console.log("hello from vercel")
  const getUser = async () => {
    console.log("TEST")

    const user = await currentUser();

    console.log("USER: ", user)

    
  }
  
  getUser();

  return (
    <div>Profile!</div>
  )
}

export default page