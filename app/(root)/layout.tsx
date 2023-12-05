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
import { getChatsWithUsersByUserId } from "@/lib/actions/chat.actions";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sparks",
  description: "Discover New AI Powered Ideas like never before",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const getDbUser = async () => {
    const user = await currentUser();
    if(user)
    {
      const dbUser = await fetchUser(user.id)
      const chats: any[] = await getChatsWithUsersByUserId(user.id)
      return {dbUser, chats};
    }
  }
  
  const data :any = await getDbUser();

  console.log("Layout DATA:" , data)

  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >
      <html lang='en'>
        <body className={inter.className}>
          <Topbar />

          <main className='flex flex-row'>
            <LeftSidebar user={data.dbUser}/>
            <section className='main-container'>
              <div className='w-full max-w-4xl'>{children}</div>
            </section>
            <RightBar chats={data.chats} />
          </main>
          <Bottombar user={data.dbUser} />
        </body>
      </html>
    </ClerkProvider>
  );
}
