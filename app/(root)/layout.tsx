import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider, currentUser} from "@clerk/nextjs";
import { dark } from "@clerk/themes";

import "../globals.css";
import Topbar from "@/components/shared/TopBar";
import LeftSidebar from "@/components/shared/LeftBar";
import Bottombar from "@/components/shared/BottomBar";
import RightBar from "@/components/shared/RightBar";
import { fetchUser } from "@/lib/actions/user.actions";
import { getChatsWithUsersByUserId, updateOnlineStatus } from "@/lib/actions/chat.actions";

//Global State
import { AppProvider } from "@/lib/AppContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sparks",
  description: "Discover New AI Powered Ideas like never before",
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const getDbUser = async () => {
    const user = await currentUser();
    if(user)
    {
      updateOnlineStatus(user.id, true);
      const dbUser = await fetchUser(user.id)
      let chats: any[] = await getChatsWithUsersByUserId(user.id)
      const sortedChats = chats.sort((chatA, chatB) => {
        const lastMessageA = chatA.messages[chatA.messages.length - 1];
        const lastMessageB = chatB.messages[chatB.messages.length - 1];
      
        const dateA = new Date(lastMessageA.timestamp);
        const dateB = new Date(lastMessageB.timestamp);
      
        // Compare the dates (descending order, latest time first)
        //@ts-ignore
        return dateB - dateA;
      });  
      
      if(sortedChats.length > 1)
      {
        chats = sortedChats;
      }
      return {dbUser, chats};
    }
  }


  
  const data :any = await getDbUser();
  
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >
      <html lang='en'>
        <body className={inter.className}>
        <AppProvider>
          <Topbar user={data.dbUser}/>
          <main className='flex flex-row'>
            <LeftSidebar user={data.dbUser}/>
            <section className='main-container'>
              <div className='w-full max-w-4xl'>{children}</div>
            </section>
            <RightBar chats={data.chats}  />
          </main>
          <Bottombar user={data.dbUser} />
          </AppProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}



