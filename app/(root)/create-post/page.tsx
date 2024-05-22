import { fetchUser } from "@/lib/actions/user.actions"
import { currentUser } from "@clerk/nextjs"
import { redirect } from  "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { postTabs } from "@/constants";
import Image from "next/image";
import Studio from "@/components/studio/Studio";

const page = async () => {
  const user = await currentUser();
  if (!user) redirect('/');

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");


  return (
    <section>
    <h1 className="head_text text-center blue_gradient">Spark Studio </h1>
    <div className="mt-4">
    <Tabs defaultValue="Regular" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
      {postTabs.map((tab) => (
              <TabsTrigger key={tab.label} value={tab.value} className="text-black data-[state=active]:bg-primary-500 data-[state=active]:text-light-2">
                 <p className='max-lg:hidden'>{tab.label}</p>
                <Image
                  src={tab.icon}
                  alt={tab.label}
                  width={24}
                  height={24}
                  className='object-contain'
                />
              </TabsTrigger>
            ))}
      </TabsList>
      {postTabs.map((tab) => (
        <TabsContent key={`content-${tab.label}`} value={tab.value} className="w-full text-black">
          <Studio data={user.id} type={tab.value} />
        </TabsContent>
          ))}
    </Tabs>
    </div>
    </section>
  )
}

export default page