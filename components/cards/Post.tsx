"use client"

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getImageData } from "@/lib/s3";
import { addLikeToPost, removeLikeFromPost } from "@/lib/actions/post.actions";
import { CSSTransition } from "react-transition-group";

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
  likes: string
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
  likes
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

    console.log("Created AT: ", createdAt)
    const [img, setImg] = useState('/assets/profile.svg');
    const [like, setLike] = useState(isInsideLikes());
    const [commentImgs, setCommentImgs] = useState(['/assets/profile.svg', '/assets/profile.svg'])
    const [floatingHearts, setFloatingHearts] = useState(false);
    const [numLikes, setNumLikes] = useState(filterLikes())

    useEffect( () => {
        const loadCommentImages = async () => {
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
        
        loadCommentImages();
      }, [like])

      const handleLikeClick = async () => {
        // Like logic here
        setLike(!like);
        try{
        // Toggle the like status in the database
          if (like) {
            await removeLikeFromPost(id, currentUserId);
            setNumLikes(prevNumLikes => prevNumLikes - 1);
          } else {
            await addLikeToPost(id, currentUserId);
            setNumLikes(prevNumLikes => prevNumLikes + 1);
          }

        setFloatingHearts(true)

         // After a short delay (e.g., 1000ms), reset the "like" state to hide the floating heart
        setTimeout(() => setFloatingHearts(false), 1000);
        
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
    <article
      className={`flex w-full flex-col rounded-xl ${
        isComment ? "px-0 xs:px-7" : "bg-primary-500 p-7"
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

            <p className='mt-2 text-small-regular text-light-2'>{content}</p>

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
      {/* 
        <DeleteThread
          threadId={JSON.stringify(id)}
          currentUserId={currentUserId}
          authorId={author.id}
          parentId={parentId}
          isComment={isComment}
        /> */}
        
      </div>

      <div className="flex flex-row gap-2 transition-all duration-300 ease-in-out">
      {!isComment && comments?.length > 0 && (
        <div className='ml-1 mt-3 flex items-center gap-2'>
          {comments.slice(0, 2).map((comment, index) => (
            <Image
              key={index}
              src={commentImgs[index]}
              // src={comment.author.image}
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

    </article>
  );
}

export default Post;