"use client";

import { z } from "zod";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { usePathname } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";

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
import { getImageData } from "@/lib/s3";

interface Props {
  postId: string;
  currentUserImg: string;
  currentUserId: string;
}



function Comment({ postId, currentUserImg, currentUserId }: Props) {
  const [img, setImg] = useState('/assets/profile.svg');

  useEffect( () => {
    const load = async () => {
      try{
        if(currentUserImg.startsWith('user'))
        {
            const res = await getImageData(currentUserImg);
            if(res)
            {
            setImg(res);
            }
        }else{
            setImg(currentUserImg)
        }
      }catch(error)
      {
        console.log("Error" , error)
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
    await addCommentToPost(
      postId,
      values.comment,
      currentUserId,
      pathname,
      currentUserImg,
    );

    form.reset();
  };

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
                  className='rounded-full object-cover'
                />
              </FormLabel>
              <FormControl className='border-none bg-transparent'>
                <Input
                  type='text'
                  {...field}
                  placeholder='Comment...'
                  className='no-focus text-light-1 outline-none'
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type='submit' className='comment-form_btn'>
          Reply
        </Button>
      </form>
    </Form>
  );
}

export default Comment;