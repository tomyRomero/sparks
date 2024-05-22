import { currentUser } from "@clerk/nextjs";

import { fetchUser } from "@/lib/actions/user.actions";
import AccountProfile from "@/components/forms/AccountProfile";
import { redirect } from "next/navigation";

async function Page() {
  const user = await currentUser();
  if (!user) redirect('/');

  const userInfo = await fetchUser(user.id);
  

  const userData = {
    id: user.id,
    objectId: userInfo?.id,
    username: userInfo ? userInfo?.username : user.username,
    name: userInfo ? userInfo?.name : user.firstName ?? "",
    bio: userInfo ? userInfo?.bio : "",
    image: userInfo ? userInfo?.image : user.imageUrl,
  };

  return (
    <main className='mx-auto flex max-w-3xl flex-col justify-start px-10 py-10'>
      <h1 className='head-text mx-auto text-primary-500'>Edit Sparks Profile</h1>
      <p className='mx-auto mt-3 text-base-regular text-primary-500'>
        Make adjustments to your profile.
      </p>
      <section className='mt-5 bg-blue-800 p-10 rounded-3xl'>
        <AccountProfile user={userData} btnTitle='Edit' edit={true} />
      </section>
    </main>
  );
}

export default Page;