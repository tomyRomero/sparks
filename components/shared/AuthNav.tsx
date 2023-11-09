"use client"

import Link from "next/link";
import Image from "next/image";
import { redirect,useRouter } from "next/navigation";

interface Props{
    isLogin: boolean;
}

function AuthNav({isLogin}: Props)
{
    const router = useRouter();
    return(
        <nav className="topbar">
            <Link href="/" className="flex items-center gap-4">
             <Image 
             src="/assets/logo.svg"
             alt="logo"
             width={28}
             height={28}
             />
            <p className="font-agbalumo text-heading3-bold text-light-1"><span className="text-blue">SPARK</span>-IFY</p>
            </Link>
            {
                isLogin? 
                (<button className="blue_btn" onClick={() => {router.push('/sign-up')}}>
                    Sign Up
                </button>) 
                : 
                (<button className="blue_btn" onClick={() => {router.push('/sign-in')}}>
                    Login
                </button>)
            }
        </nav>
    )
}

export default AuthNav;