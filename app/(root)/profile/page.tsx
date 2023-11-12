import React from 'react'
import { currentUser } from '@clerk/nextjs';

const page = () => {

  console.log("hello from vercel")
  const getUser = async () => {
    console.log("TEST")

    const user = await currentUser();

    console.log("USER: ", user?.id)

    return user?.id;
  }
  
  const data = getUser();

  return (
    <div>
      <h1>Profile!!</h1>
      <h2>{data}</h2>
    </div>
  )
}

export default page