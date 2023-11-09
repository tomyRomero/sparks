import { SignUp } from "@clerk/nextjs";
import AuthNav from "@/components/shared/AuthNav"
import Image from "next/image";
import HeroCarousel from "@/components/shared/HeroCarousel";


export default function Page() {
  return (
    <section>
      <AuthNav isLogin={false}/>
      <div className="w-full flex gap-10 mt-20 max-lg:flex-col" > 
        <div className="flex flex-col mx-8">
            <h1 className="head_text text-center teal_gradient">Welcome to Sparkify!</h1>  
            <p className="desc mx-auto text-center">
            Discover New Ideas for all things creative! Like never before! By using AI to generate ideas! Sign up to get Started!
            </p>
            <div className="mt-10 mx-auto max-lg:hidden lg:w-4/5 xl:w-3/5 lg:h-1/2 xl:h-1/2">
            <HeroCarousel />
            </div>
        </div>
        <div className="mx-auto">
          <SignUp />
        </div>
      </div> 
    </section>
  )
}