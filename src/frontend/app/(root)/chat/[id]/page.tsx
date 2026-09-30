import Chat from "@/components/forms/Chat";
import { getChatBySenderAndReceiver } from "@/lib/actions/chat.actions";
import { fetchUser } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";


const page = async (props: { params: Promise<{ id: string }> }) => {
    const params = await props.params;

    const user = await currentUser();
    if (!user) redirect('/');
   
    const dbUser = await fetchUser(params.id)

    //user would then use its ID and the ID of the searchParams to get the chat that belongs to those two
    //Chat data would look a little like this. 
    let chatData = {
        receiver_id: params.id,
        receiver_image: dbUser.image,
        messages: [],
        read_status: true,
        sender_id: user.id,
        receiver_name: dbUser.name
      };

    const chat = await getChatBySenderAndReceiver(user.id, params.id);
    
    if(chat)
    {
      chatData = chat;
    }

  return (
   <div>
    <Chat  chatPicture={chatData.receiver_image}  chatName={chatData.receiver_name} chatMessages={chatData.messages} userID={chatData.sender_id} receiver={chatData.receiver_id} isRead={chatData.read_status}/>
   </div>
  )
}

export default page