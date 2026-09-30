"use client";

import { z } from "zod";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { usePathname } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";

import { Input } from "../ui/input";
import { Button } from "../ui/button";

import { CommentValdiation } from "@/lib/validations/post";
import { addCommentToPost } from "@/lib/actions/post.actions";
import { getImageData, getRes } from "@/lib/s3";
import { AppProvider, useAppContext } from "@/lib/AppContext";

interface Props {
  postId: string;
  currentUserImg: string;
  currentUserId: string;
  parentId: string
}


function Comment({ postId, currentUserImg, currentUserId, parentId }: Props) {
  const [img, setImg] = useState('/assets/imgloader.svg');
  const [loading, setLoading] = useState(false);
  const [backLoading, setBackLoading] = useState(false)
  const router = useRouter();

  const {newComment, setNewComment} = useAppContext();

  useEffect( () => {
    const load = async () => {
      try{
        setImg(await getRes(currentUserImg))
      }catch(error)
      {
        console.log("Error" , error)
        setImg('/assets/profile.svg')
      }
    }

    load();

  }, [])
  
  const pathname = usePathname();

  const form = useForm<z.infer<typeof CommentValdiation>>({
    resolver: zodResolver(CommentValdiation),
    defaultValues: {
      comment: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof CommentValdiation>) => {
    setLoading(true)
    const added = await addCommentToPost(
      postId,
      values.comment,
      currentUserId,
      pathname,
      currentUserImg,
    );

    if(added){
      setNewComment(!newComment)
    }

    form.reset();
    setLoading(false)
  };

  const goBack = () => {
    setBackLoading(true)
    
    if(!parentId)
    {
      router.push('/')
    }else{
      router.push(`/post/${parentId}`)
    }
  }

  return (
    <Form {...form}>
      <form className='comment-form' onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name='comment'
          render={({ field }) => (
            <FormItem className='flex w-full items-center gap-3'>
              <FormLabel>
                <Image
                  src={img}
                  alt='current_user'
                  width={48}
                  height={48}
                  className='aspect-[1/1] rounded-full object-cover'
                />
              </FormLabel>
              <FormControl className='border-none bg-transparent'>
                <Input
                  type='text'
                  {...field}
                  placeholder='Comment On Post...'
                  className='no-focus text-black outline-none'
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="button" onClick={goBack} className="comment-form_btn max-md:hidden">
          {!backLoading? <h1>Back</h1> : <Image src={"/assets/lineloader.svg"} alt="loading" width={44} height={34}/> }
        </Button>

        <Button type='submit' className='comment-form_btn max-md:hidden'>
          {!loading? <h1>Reply</h1> : <Image src={"/assets/lineloader.svg"} alt="loading" width={44} height={34}/> }
        </Button>

        <div className="hidden w-full ml-auto max-sm:flex justify-end gap-4">
        <Button type="button" onClick={goBack} className="comment-form_btn">
          {!backLoading? <h1>Back</h1> : <Image src={"/assets/lineloader.svg"} alt="loading" width={44} height={34}/> }
        </Button>

        <Button type='submit' className='comment-form_btn'>
          {!loading? <h1>Reply</h1> : <Image src={"/assets/lineloader.svg"} alt="loading" width={44} height={34}/> }
        </Button>
        </div>
      </form>
     
    </Form>
  );
}

export default Comment;