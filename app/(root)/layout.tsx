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
  
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >
      <html lang='en'>
        <body className={inter.className}>
        <AppProvider>
          <Topbar />
          <main className='flex flex-row'>
            <LeftSidebar />
            <section className='main-container'>
              <div className='w-full max-w-4xl'>{children}</div>
            </section>
            <RightBar />
          </main>
          <Bottombar />
          </AppProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}



