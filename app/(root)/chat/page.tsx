import Image from "next/image"
import Searchbar from "@/components/shared/Searchbar"
import { fetchUser, fetchUsers } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import HorizontalScroll from "@/components/shared/HorizontalScroll";
import { getChatsWithUsersByUserId, updateOnlineStatus } from "@/lib/actions/chat.actions";
import ChatLogs from "@/components/cards/ChatLogs";

async function Page({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const result = await fetchUsers({
    userId: user.id,
    searchString: searchParams.q,
    pageNumber: searchParams?.page ? +searchParams.page : 1,
    pageSize: 15,
  });

  let chats: any[] = await getChatsWithUsersByUserId(user.id)

  const sortedChats = chats.sort((chatA, chatB) => {
    const lastMessageA = chatA.messages[chatA.messages.length - 1];
    const lastMessageB = chatB.messages[chatB.messages.length - 1];
  
    const dateA = new Date(lastMessageA.timestamp);
    const dateB = new Date(lastMessageB.timestamp);
  
    console.log("Timestamp A: ", lastMessageA.timestamp);
    console.log("Date A: ", dateA);
  
    console.log("Timestamp B: ", lastMessageB.timestamp);
    console.log("Date B: ", dateB);
  
    // Compare the dates (descending order, latest time first)
    //@ts-ignore
    return dateB - dateA;
  });  
  
  if(sortedChats.length > 1)
  {
    chats = sortedChats;
  }
  
  return (
    <section className='w-full h-screen flex flex-col bg-black rounded-xl'>
      <div className="flex">
        <h1 className='text-heading1-bold text-light-1 ml-4 mt-2'>Chat</h1>
        <Image 
          src={"/assets/startchat.svg"}
          alt="Create Chat"
          width={34}
          height={34}
          className="ml-auto mr-4 cursor-pointer"
        />
      </div>
      <div className="w-11/12 mx-auto m-1 p-1 border-b-2 border-white" />

      <div className="p-4">
        <Searchbar routeType='chat' />
      </div>

      <div className="mx-auto md:hidden">
        <HorizontalScroll results={result} bubbles={3}/>
      </div>

      <div className="mx-auto hidden md:block">
        <HorizontalScroll results={result} bubbles={5}/>
      </div>

      <br></br>
      <h2 className="text-left ml-4 text-heading3-bold text-light-1">Recent Chats..</h2>
      <div className="p-4 flex flex-col overflow-y-auto overflow-hidden">
        {chats.length === 0 ? (
          <p className="text-light-1 text-center">No Recent Chats, Click on A User Bubble To Get Started, Can Also Search for Users to Message</p>
        ): (
          <>
          {chats.map((chat: any) => (
           <ChatLogs chatRead={chat.read_status} senderID={chat.sender_id} receiverID={chat.receiver_id} chatMessages={chat.messages} receiverPicture={chat.user_image} chatName={chat.user_username} isHome={false} path={'/chat'}/>
          ))}
        </>
      )}
    </div>
  </section>
);
}

export default Page;
