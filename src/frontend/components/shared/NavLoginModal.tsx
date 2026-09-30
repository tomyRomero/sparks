"use client"

import { Button } from "@/components/ui/button"
import { DialogTrigger, DialogTitle, DialogDescription, DialogHeader, DialogContent, Dialog } from "@/components/ui/dialog"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

const NavLoginmodal = ({image, label}: {image: string , label:string})=> {

 const router = useRouter();

  return (
    <Dialog >
      <DialogTrigger asChild>
      <button type="button"  className="flex gap-4">
      <Image 
        src={image}
        alt={label}
        width={35}
        height={35}
        />
        <p className="self-center text-light-1 max-lg:hidden">
        {label}
        </p>
    </button>

      </DialogTrigger>
      <DialogContent className="rounded-xl sm:max-w-[425px]">
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



export default NavLoginmodal;
