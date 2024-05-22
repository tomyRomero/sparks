import Image from "next/image";
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { profileTabs } from "@/constants";
import ProfileHeader from "@/components/shared/ProfileHeader";
import PostsTab from "@/components/shared/PostsTab";
import CommentsTab from "@/components/shared/CommentsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchUser } from "@/lib/actions/user.actions";
import LikedTab from "@/components/shared/LikedTab";
import { updateOnlineStatus } from "@/lib/actions/chat.actions";

async function Page({ params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) redirect('/');

  const userInfo = await fetchUser(params.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  return (
    <section>
      <ProfileHeader
        accountId={userInfo.id}
        authUserId={user.id}
        name={userInfo.name}
        username={userInfo.username}
        imgUrl={userInfo.image}
        bio={userInfo.bio}
      />

      <div className='mt-9'>
        <Tabs defaultValue='posts' className='w-full'>
          <TabsList className='tab'>
            {profileTabs.map((tab) => (
              <TabsTrigger key={tab.label} value={tab.value} className='tab'>
                <Image
                  src={tab.icon}
                  alt={tab.label}
                  width={24}
                  height={24}
                  className='object-contain'
                />
                <p className='max-sm:hidden'>{tab.label}</p>
                
              </TabsTrigger>
            ))}
          </TabsList>

          {profileTabs.map((tab) => (
            <TabsContent
              key={`content-${tab.label}`}
              value={tab.value}
              className='w-full text-light-1'
            >
                {/* Conditionally render PostsTab only if the tab value is 'Posts' */}
            {tab.value === 'posts' && (
              <PostsTab
                currentUserId={user.id}
                accountId={userInfo.id}
              />
            )}

            {tab.value === 'comments' && (
              <CommentsTab
                currentUserId={user.id}
                accountId={userInfo.id}
              />
            )}  

            {tab.value === 'liked' && (
              <LikedTab
                currentUserId={user.id}
                accountId={userInfo.id}
              />
            )}  
          
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
export default Page;