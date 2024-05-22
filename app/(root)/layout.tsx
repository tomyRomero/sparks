
import React from "react";
import { Inter } from "next/font/google";
import { ClerkProvider} from "@clerk/nextjs";
import { dark } from "@clerk/themes";

import "../globals.css";
import Topbar from "@/components/shared/TopBar";
import LeftSidebar from "@/components/shared/LeftBar";
import Bottombar from "@/components/shared/BottomBar";
import RightBar from "@/components/shared/RightBar";

//Global State
import { AppProvider } from "@/lib/AppContext";
import { getClerkUser } from "@/lib/actions/user.actions";
import Loading from "./loading";
import { updateOnlineStatus } from "@/lib/actions/chat.actions";
import { Metadata } from "next/types";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sparks",
  description: "With Sparks, share AI-generated ideas, engage in lively chats, and enjoy a seamless experience with likes, comments, and shares all in one place.",
};


export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  let userid = await getClerkUser();
  if (!userid) userid = "null"

  if(userid)
  updateOnlineStatus(userid, true)


  return (
    userid?.length ? (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >
      <html lang='en'>
        <body className={inter.className}>
         <AppProvider>
          <Topbar userId={userid}/> 
          <main className='flex flex-row'>
            <LeftSidebar userid={userid} /> 
            <section className='main-container'>
              <div className='w-full max-w-4xl mt-6'>{children}</div>
            </section>
            <RightBar userid={userid}/>
          </main>
            <Bottombar userid={userid}/>
            <Toaster />
          </AppProvider>
        </body>
      </html>
    </ClerkProvider>
  )
  : (
    <div>
      <Loading />
    </div>
  )
  )
}



