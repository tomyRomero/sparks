import { Button } from "@/components/ui/button";
import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

export default function Page() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 h-screen">
      {/* Section for XL screens */}
      <div className="hidden lg:block" style={{ backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundImage: "url('/assets/hero.jpg')" }}>
        <p className="mt-40 bg-white p-4 text-body-semibold text-center mx-auto w-3/4 rounded-lg">Sparks is your AI Social Media hub, where creativity meets connection. Share AI-generated ideas, engage in lively chats, and enjoy a seamless experience with likes, comments, and shares all in one place. Beyond that, post regularly, upload images, and explore user profiles. Discover, connect, and express yourself effortlessly. Sign up now for a richer, more dynamic social experience!</p>
      </div>

      {/* Section for Large and medium screens */}
      <div className="flex flex-col justify-center items-center w-full h-full">
        <div className="max-w-2xl w-full p-8 max-lg:bg-[url('/assets/hero.jpg')] bg-cover bg-no-repeat bg-center">
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-heading1-bold text-white max-md:text-primary-500 text-center">Welcome To Sparks!</h3>
            <Image src="/assets/logo.svg" alt="logo" width={30} height={30} className="bg-white rounded-full" />
            <p className="hidden max-md:block bg-white p-4 text-subtle-semibold text-center mx-auto w-3/4 rounded-lg">Sparks is your AI Social Media hub, where creativity meets connection. Share AI-generated ideas, engage in lively chats, and enjoy a seamless experience with likes, comments, and shares all in one place. Beyond that, post regularly, upload images, and explore user profiles. Discover, connect, and express yourself effortlessly. Sign up now for a richer, more dynamic social experience!</p>
            <p className="text-white text-center max-md:hidden">Please Sign Up Here</p>
            <div className="max-xs:m-0 ml-4">
            <Link href="/" className="w-[3/4] flex items-center justify-center">
            <Button variant="outline" className=" ">
            <Image 
               src={"/assets/login.png"}
               alt="home icon"
               width={24}
               height={24}
               className="object-contain mr-2"
                />
                Home
            </Button>
            </Link>
            <br></br>
            <SignUp />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
