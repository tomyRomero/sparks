"use client"

import { Button } from "@/components/ui/button"
import { DialogTrigger, DialogTitle, DialogDescription, DialogHeader, DialogContent, Dialog } from "@/components/ui/dialog"
import { redirect, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

const Loginmodal = ({image}: {image: string})=> {

  const router = useRouter();

  return (
    <Dialog >
      <DialogTrigger asChild>
      <button type="button" >
                <Image
                  src={image}
                  alt='share'
                  width={24}
                  height={24}
                  className='cursor-pointer object-contain'
                />
    </button>

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

export default Loginmodal;
