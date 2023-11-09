import AuthNav from "@/components/shared/AuthNav";
import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
export default function Page() {
  return(
    <section>
      <AuthNav isLogin={true}/>
      <div className="w-full flex gap-10 mt-20 max-lg:flex-col" > 
        <div className="flex flex-col mx-8">
            <h1 className="head_text text-center teal_gradient">Discover And Share
                <br />
                <span className="teal_gradient text center"> AI-Powered Inspiration</span>
            </h1>  
            <p className="desc mx-auto text-center">
            Sparkify is an AI Social Media platform that allows users to create and share AI generated Ideas with others as well as discover your own!
            </p>
            <div className="mt-10 mx-auto lg:mx-auto lg:h-96 xl:h:96 max-lg:hidden">
            <Image
              src="/assets/hero.jpg"
              alt="Hero"
              width={350}
              height={10}
              className="object-contain rounded-3xl"
            />
            </div>
        </div>
        <div className="mx-auto">
          <SignIn />
        </div>
      </div> 
    </section>
  )
}
