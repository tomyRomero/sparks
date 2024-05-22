import { currentUser } from "@clerk/nextjs";
import { fetchUser } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";
import FilterBox from "@/components/shared/FilterBox";
import SearchButton from "@/components/shared/SearchButton";
import InfiniteFeed from "@/components/InfiniteFeed";


async function Home() 
{
  const user = await currentUser();
  if (!user) 
    {
      return (
        <>
          <h1 className='head-text text-left text-black mb-6'>Recent Sparks...</h1>
          <FilterBox />
          <br/>
          <SearchButton user={false}/>
          <InfiniteFeed user={null}/>
        </>
      )
    }

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

 return (
    <>
      <h1 className='head-text text-left text-black mb-6'>Recent Sparks...</h1>
      <FilterBox />
      <br/>
      <SearchButton user={true}/>
      <InfiniteFeed user={user.id}/>
    </>
  );
}

export default Home;
