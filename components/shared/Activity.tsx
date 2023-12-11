"use client"

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { getImageData } from '@/lib/s3'
import { useEffect, useState } from 'react'
import { fetchUser } from '@/lib/actions/user.actions'
import { fetchPostById, updatePostReadStatus } from '@/lib/actions/post.actions'
import { useAppContext } from '@/lib/AppContext'

interface Props {
  parentid: string
  idpost: string;
  authorUsername: string;
  authorImage: string;
  activityKey: string
  type: string;
  likes: string;
  time: string;
  content: string;
  title: string;
  read_status: boolean | null;
}


const Activity = ({idpost, authorUsername, authorImage, activityKey, parentid, type, likes, time, content, title, read_status} : Props) => {
  const [img, setImg] = useState("/assets/imgloader.svg");
  const [parentContent, setParentContent] = useState('')
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {readActivity, setReadActivity} = useAppContext();

  const filterLikes = () => {
    // Remove trailing comma and split the string by commas
    //@ts-ignore
    const valuesArray = likes.slice(0, -1).split(',');
    // Filter out empty strings and get the count
    //@ts-ignore
    const numberOfLikes = valuesArray.filter(value => value !== '').length;

    if(numberOfLikes - 1 === 0){
      return ""
    }else if (numberOfLikes - 1 === 1)
    {
      return "and another person "
    }else if(numberOfLikes - 1 > 1){
      return ` and ${numberOfLikes} others `
    }else{
      return ""
    }
  }

  function extractTitle(inputString: string): string {
    const titleMatch = inputString.match(/Title:([\s\S]*?)(Synopsis:|$)/i);
    return titleMatch ? titleMatch[1].trim() : '';
  }

  function truncateWords(str: string, maxWords: number): string{
    const words = str.split(' ');
    const truncatedWords = words.slice(0, maxWords).join(' ');
  
    return words.length <= maxWords ? str : `${truncatedWords}...`;
  }

  function reformatDateString(dateString: string) {
    const originalDate = new Date(dateString);
    
    const options = { hour: 'numeric', minute: 'numeric', hour12: true, month: 'numeric', day: 'numeric', year: 'numeric' };
  
    //@ts-ignore
    const reformattedDate = originalDate.toLocaleString('en-US', options);
    return reformattedDate;
  }

  function containsSpark(inputString: string): boolean{
    const lowercasedString = inputString.toLowerCase();
    return lowercasedString.includes('spark');
  }


  useEffect(() => { 
    const loadProfile = async () => {
      try {
        let loadImg = authorImage

        //If type is equal to like then authorImage contains the ID of the user that last liked the post
        //We use the ID to fetch the user and get the image, then load
        if(type === "like")
        {
          const user = await fetchUser(authorImage)
          loadImg = user.image
        }

        let imgResult = '/assets/profile.svg';

        if (loadImg.startsWith('user')) {
          const res = await getImageData(loadImg);
          imgResult = res;
        } else {
          imgResult = loadImg;
        }

        setImg(imgResult);
      } catch (error) {
        setImg('/assets/profile.svg');
        console.log("Error", error);
      }
    };

    const getParentContent = async () => {
      if(parentid){
        const post = await fetchPostById(parentid)

        if(post)
        {
          setParentContent(post.content)
        }
      }
    }

    loadProfile();
    getParentContent();
  }
  , [])

  const goToActivity = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    setLoading(true)
    event.preventDefault();
    const clearActivity = await updatePostReadStatus(idpost)

    if(clearActivity)
    {
      router.push(`/post/${parentid? parentid: idpost}`)
      setReadActivity(!readActivity)
    }else{
      alert("Something happened and the Notifaction was Deleted")
    }
  }
  useEffect (()=> {
    router.refresh()
  },[readActivity, setReadActivity] )

  return (
    <>
    <Link key={activityKey} href={`/post/${parentid? parentid: idpost}`} onClick= {goToActivity}>
        <article className={`activity-card hover:bg-cyan-500 ${ loading ? "hidden" : ""}`}>
            <Image
                src={img}
                alt='user_logo'
                width={20}
                height={20}
                className='rounded-full object-cover'
            />
        <p className='!text-small-regular text-light-1'>
        <span className='mr-1 text-primary-500'>
        {authorUsername}
        </span>{" "}
        {type === "like" ? (
            <>
              {filterLikes()}liked your {containsSpark(title) ? 
              `${title}!` 
              : 
              `post! `}
              {" "}
               <span className={`mr-1 text-primary-500 ${containsSpark(title) ? 'hidden' : ''}`}>
               {truncateWords(content, 3)}
               </span>
              <span
                className='mr-1 text-primary-500'
              >
                {extractTitle(content)}
              </span>
            </>
          ) : (
            <>replied 
            <span className='mr-1 text-primary-500'>{` ${truncateWords(content, 4)} `}</span>
            to your post! 
            <span className='mr-1 text-primary-500'>{` ${truncateWords(parentContent, 4)}`}</span>
            </>
          )}
    <span>{` at ${reformatDateString(time)}`}</span>
    </p>
    { read_status && (
             <Image 
             src={"/assets/alert.svg"}
             alt={"alert"}
             width={20}
             height={20}
            />
          )}
      
    </article>
    
    
    <article className={`activity-card hover:bg-cyan-500 ${ loading ? "" : "hidden"}`}>
      <Image
        src={"/assets/postloader.svg"}
        alt={"loading animation"}
        width={40}
        height={20}
      />
    </article>
      
    </Link>
    </>
  )
}

export default Activity