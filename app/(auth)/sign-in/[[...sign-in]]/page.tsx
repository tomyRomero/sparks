import AuthNav from "@/components/shared/AuthNav";
import HeroCarousel from "@/components/shared/HeroCarousel";
import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
export default function Page() {
  return(
    <section>
      <AuthNav isLogin={true}/>
      <div className="w-full flex gap-10 mt-20 max-lg:flex-col" > 
        <div className="flex flex-col mx-8 bg-black rounded-lg p-6">
            <h1 className="head_text text-center teal_gradient">Discover And Share
                <br />
                <span className="teal_gradient text center"> AI-Powered Inspiration</span>
            </h1>  
            <p className="desc mx-auto text-center bg-white rounded-lg p-4 shadow-primary">
            Sparks is an AI Social Media platform that allows users to create and share AI generated Ideas with others as well as discover your own!
            </p>
            <div className="mt-10 mx-auto max-lg:hidden lg:w-4/5 xl:w-3/5 lg:h-1/2 xl:h-1/2">
            <HeroCarousel />
            </div>
        </div>
        <div className="mx-auto">
          <SignIn />
        </div>
      </div> 
    </section>
  )
}
