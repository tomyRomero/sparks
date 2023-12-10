import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { fetchUser } from "@/lib/actions/user.actions";
import { fetchPostById} from "@/lib/actions/post.actions";
import { fetchLikesAndCommentsByUser } from "@/lib/actions/user.actions";
import Activity from "@/components/shared/Activity";
import { updateOnlineStatus } from "@/lib/actions/chat.actions";

async function Page() {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  updateOnlineStatus(user.id, true);
  const activity = await fetchLikesAndCommentsByUser(user.id, 5);

  function getLastUserId(likes: string) {
    // Split the string using commas and filter out empty strings
    const userIdsArray = likes.split(',').filter(Boolean);
  
    // Get the most recent user ID
    const lastUserId = userIdsArray[userIdsArray.length - 1];
  
    return lastUserId;
  }

  const getUserUsername = async (userId: string) => {
    const user = await fetchUser(userId)

    if(user)
    {
      return user.username
    }
    else{
      return "A user"
    }
  }

  console.log("Activity: ", activity)

  return (
    <>
  <h1 className='head-text text-black'>Notifications</h1>
  <section className='mt-10 flex flex-col gap-5 rounded-lg'>
  {activity.length > 0 ? (
    <>
      {activity.map((activity) => (
        <Activity 
          idpost={activity.idpost}
          authorUsername={
            activity.type === "like" ? 
             getUserUsername(getLastUserId(activity.likes))
            :
            activity.author_username
          }
          authorImage={
            activity.type === "like" ? 
             getLastUserId(activity.likes)
            :
            activity.author_image
          }
          activityKey={activity._id}
          parentid={activity.parent_id}
          type={activity.type}
          likes={activity.likes}
          time={
            activity.type === "like" ? 
            activity.recent_like
            : 
            activity.created_at
          }
          content = {activity.content}
          title = {activity.title}
          read_status = {activity.read_status}
        />
      ))}
    </>
  ) : (
    <p className='!text-base-regular text-light-3'>No activity yet</p>
  )}
    </section>
    </>
  );
}

export default Page;