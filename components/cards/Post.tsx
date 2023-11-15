"use client"

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getImageData } from "@/lib/s3";
import { addLikeToPost, removeLikeFromPost } from "@/lib/actions/post.actions";
import DeletePost from "../forms/DeletePost";
import { fetchUser } from "@/lib/actions/user.actions";

interface Props {
  id: string;
  currentUserId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  comments: {
    author: {
      image: string;
    };
  }[];
  isComment?: boolean;
  image: string;
  username: string;
  likes: string;
  authorId: string;
  contentImage?: string
  title: string;
}

function Post({
  id,
  currentUserId,
  parentId,
  content,
  createdAt,
  comments,
  isComment,
  image,
  username, 
  likes,
  authorId,
  contentImage,
  title
}: Props) {
    const isInsideLikes = () => {
        // Split the comma-separated string into an array
      const userIdsArray = likes.split(',');

      // Check if the userIdToCheck is in the array
      return userIdsArray.includes(currentUserId);
    }

    const filterLikes = () => {
      // Remove trailing comma and split the string by commas
      //@ts-ignore
      const valuesArray = likes.slice(0, -1).split(',');

      // Filter out empty strings and get the count
      //@ts-ignore
      const numberOfLikes = valuesArray.filter(value => value !== '').length;
      
      return numberOfLikes
    }

    const [img, setImg] = useState('/assets/imgloader.svg');
    const [like, setLike] = useState(isInsideLikes());
    const [commentImgs, setCommentImgs] = useState(['/assets/imgloader.svg', '/assets/imgloader.svg'])
    const [floatingHearts, setFloatingHearts] = useState(false);
    const [numLikes, setNumLikes] = useState(filterLikes())
    const [contentImg, setContentImg] = useState('/assets/postloader.svg')

    useEffect( () => {
      const loadImages = async () => {
        try{
          if(image.startsWith('user'))
          {
              const res = await getImageData(image);
              if(res)
              {
              setImg(res);
              }
          }else{
              setImg(image)
          }

          //Logic to Set the Images of the Comments, using an Array so that it can load when we map them. 
          const imgArray: any = []
          for (let index = 0; index < 2; index++) {
            const element = comments[index];
            if(element)
            {
              //@ts-ignore
              if(element.image)
              {
                //@ts-ignore
                const img = element.image
                console.log("ELEMENT IMAGE:",img)
                if(img.startsWith('user'))
                {
                  const res = await getImageData(img);
                    if(res)
                    {
                    imgArray.push(res)
                    }else{
                      imgArray.push('/assets/profile.svg')
                    }
                }else{
                  imgArray.push(img)
                }
              }
            }
          }
          setCommentImgs(imgArray);
        }catch(error)
        {
          console.log("Error" , error)
        }
      }

        const loadContentImage = async () => {
          //@ts-ignore
          if(contentImage?.length > 0 && contentImage?.startsWith('user'))
          {
            try{
              const content = await getImageData(contentImage)
              if(content)
              {
                setContentImg(content);
              }else{
                setContentImg('/assets/failed.svg')
              }
            }catch(error)
            {
              console.log("Error Getting Content Image:", error)
              setContentImg('/assets/failed.svg')
            }
          }else{
            setContentImg('/assets/failed.svg')
          }
        }
        
        loadImages();
        loadContentImage();
      }, [])

      const handleLikeClick = async () => {
        // Like logic here
        setLike(!like);

        setFloatingHearts(true)

        try{
        // Toggle the like status in the database
          if (like) {
            await removeLikeFromPost(id, currentUserId);
            setNumLikes(prevNumLikes => prevNumLikes - 1);
          } else {
            await addLikeToPost(id, currentUserId);
            setNumLikes(prevNumLikes => prevNumLikes + 1);
          }

        // After a short delay (e.g., 500ms)
        setTimeout(() => setFloatingHearts(false), 500);
        
        }catch (error) {
          console.log("Error in Liking Post", error);
          alert("Error In Server, Unable To Like/Unlike");
        }
      };

     const filterComments = ()=> {
        // Since children are stored in database as an string "1,2,3,4" of IDs they dont get populated
        // Only if a query is ran however we only run the query for the main post so we have to manually figure out number of children based 
        // off the string, we read the length of comments directly we be returned the legnth of the string and we dont want that
        if(isComment)
        {
          // Remove trailing comma and split the string by commas
          //@ts-ignore
          const valuesArray = comments.slice(0, -1).split(',');

          // Filter out empty strings and get the count
          //@ts-ignore
          const numberOfComments = valuesArray.filter(value => value !== '').length;
          
          return numberOfComments
        }
     }

     const floatingHeartsClass = like ? "floating-hearts active" : "floating-hearts";


  return (
    <article className={`${isComment? '' : 'bg-black border-solid border-2 border-primary-500 rounded-xl'}`}>

    {/* Title */}
      <div className={`${isComment || title ==="Regular Post" ? 'hidden' : 'border-b border-solid border-primary-500 mb-1 p-1 bg-primary-500 rounded'} `}>
          <h4 className="text-base-semibold text-light-1 ml-4">{title}</h4>
      </div>
    <div
      className={`flex w-full flex-col ${
        isComment ? "px-0 xs:px-7" : "p-5"
      }`}
    >
      <div className='flex items-start justify-between'>
        <div className='flex w-full flex-1 flex-row gap-4'>
          <div className='flex flex-col items-center'>
            <Link href={`/profile/${currentUserId}`} className='relative h-11 w-11'>
              <Image
                src={img}
                alt='user_community_image'
                fill
                className='cursor-pointer rounded-full'
              />
            </Link>

            <div className='card_bar' />
          </div>

          <div className='flex w-full flex-col'>
            <Link href={`/profile/${currentUserId}`} className='w-fit'>
              <h4 className='cursor-pointer text-base-semibold text-light-1'>
                {username}
              </h4>
            </Link>

            {/* Content */}
            <p className='mt-2 text-small-regular text-light-2 ml-3'>{content}</p>

            <Image
            src={contentImg}
            alt={"postImage"}
            width={250}
            height={150}
            className={`${
              //@ts-ignore
              contentImage?.length > 0 && title !== "Comment" ? 'mt-4 object-contain rounded-md ml-3':'hidden'}`}
            />
          
            <div className={`${isComment && "mb-10"} mt-5 flex flex-col gap-3`}>
              <div className='flex gap-3.5'>
                <Image
                  src={`${like? '/assets/like.svg' : '/assets/unlike.svg'  }`}
                  alt='heart'
                  width={24}
                  height={24}
                  className={`cursor-pointer object-contain ${like ? 'pop-animation active' : 'pop-animation'}`}
                  onClick={() => {handleLikeClick()}}
                />
                <Link href={`/post/${id}`}>
                  <Image
                    src='/assets/uncomment.svg'
                    alt='comment'
                    width={24}
                    height={24}
                    className='cursor-pointer object-contain'
                  />
                </Link>
                <Image
                  src='/assets/share.svg'
                  alt='heart'
                  width={24}
                  height={24}
                  className='cursor-pointer object-contain'
                />
              </div>
              <p className="text-subtle-medium text-white">{createdAt}</p>

               {/* If there is likes render this for the comments*/}
               <div className=" flex gap-2 flex-row">
               {isComment && numLikes > 0 && (
                  <p className='mt-1 text-subtle-medium text-white'>
                    {numLikes} lik{numLikes > 1 ? "es" : "e"}
                  </p>
              )}

              { isComment && comments?.length > 0 && (
                <Link href={`/post/${id}`}>
                  <p className='mt-1 text-subtle-medium text-white'>
                    {filterComments()} repl{filterComments() > 1 ? "ies" : "y"}
                  </p>
                </Link>
              )}
               </div>   

            </div>
          </div>
        </div>
      
        <DeletePost
          postId={id}
          currentUserId={currentUserId}
          authorId={authorId}
          parentId={parentId}
          isComment={isComment}
        />
        
      </div>

      <div className="flex flex-row gap-2 transition-all duration-300 ease-in-out">
      {!isComment && comments?.length > 0 && (
        <div className='ml-1 mt-3 flex items-center gap-2'>
          {comments.slice(0, 2).map((comment, index) => (
            <Image
              key={index}
              src={commentImgs[index]}
              alt={`user_${index}`}
              width={24}
              height={24}
              className={`${index !== 0 && "-ml-5"} rounded-full object-cover`}
            />
          ))} 
          <Link href={`/post/${id}`}>
            <p className='mt-1 text-subtle-medium text-white'>
              {comments.length} repl{comments.length > 1 ? "ies" : "y"}
            </p>
          </Link>
        </div>
      )}

      {!isComment && numLikes > 0 && (
                  <p className='mt-4 text-subtle-medium text-white self-center'>
                    {numLikes} lik{numLikes > 1 ? "es" : "e"}
                  </p>
              )}
      </div>


       {/* Render the floating hearts */}
       <div className={`relative ${floatingHearts? '': 'hidden'}`}>
        {like && (
          <div className={`floating-heart`}>❤️</div>
        )}
      </div>

      </div>
    </article>
  );
}

export default Post;
