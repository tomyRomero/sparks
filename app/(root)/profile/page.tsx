import React from 'react'
import { currentUser } from '@clerk/nextjs';

const page = () => {

  const getUser = async () => {
    console.log("TEST")

    const user = await currentUser();
    
    console.log("USER: ", user)

    
  }
  

  return (
    <div>Profile</div>
  )
}

export default page