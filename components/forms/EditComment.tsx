import React, { useState } from 'react'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@/components/ui/form";
  import { useForm } from "react-hook-form";
  import { zodResolver } from "@hookform/resolvers/zod";
  import { Textarea } from "@/components/ui/textarea";
  import * as z from "zod";
import { getImageData } from '@/lib/s3';
import Image from 'next/image';
import { Button } from '../ui/button';
import { deletePost, updatePost } from '@/lib/actions/post.actions';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from '../ui/use-toast';

const EditComment = (
  {
    postId, 
    content, 
    userId, 
    isComment, 
    parentId
  }: 
    {
    postId: string, 
    content: string, 
    userId: string, 
    isComment: boolean, 
    parentId: string
    }
) => {

    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false)
   
    const path = usePathname();
    const router = useRouter();

    const EditCommentValdiation = z.object({
        content: z.string().min(5, {message: 'Minimum 2 characters'}),
        accountId: z.string(),
    })

    const form = useForm<z.infer<typeof EditCommentValdiation>>({
        resolver: zodResolver(EditCommentValdiation),
        defaultValues: {
          content: content,
          accountId: userId,
        },
      });   

const onSubmit = async (values: z.infer<typeof EditCommentValdiation>) => {
    setLoading(true);
    
    try{
      const updated = await updatePost(
        {
          postId, 
          text: values.content,
          image: ``, 
          path
        })
    
        if(updated)
        {
          toast({
            title: "Success!",
            description: `Comment Updated!`, 
          })
    
          setTimeout(() => {
            router.push(`/post/${parentId}`)
          }, 2000);
          
          setLoading(false)
        }

    }catch(error)
    {
      setLoading(false)
      toast({
        title: "Something went wrong!",
        description: `${error}`, 
        variant: "destructive",
      })
    }
};

const handleDelete = async () => {
  setDeleting(true)
  const userConfirmed = window.confirm(`Are you sure you want to delete this ${isComment? 'comment' : 'post'}?`);

  if (userConfirmed) {
    // User clicked "OK" in the confirmation dialog
    // Perform the delete operation
    try{
      await deletePost(postId, path, parentId, isComment);
       
      setDeleting(false)
      toast({
        title: "Post Deleted",
      })

     router.push(`/post/${parentId}`)
     
    }catch(error)
    {
      setDeleting(false)
      toast({
        title: "Something went wrong!",
        description: `${error}`, 
        variant: "destructive",
      })
    }
  } else {
    // User clicked "Cancel" in the confirmation dialog
    setDeleting(false)
    toast({
      title: "Deletion canceled!",
    })
  }
};


  return (
    <Form {...form}>
      <form
        className='mt-4 flex flex-col justify-start gap-10'
        onSubmit={form.handleSubmit(onSubmit)}
      >
            <div>
               {/* Content */}
            <FormField
          control={form.control}
          name='content'
          render={({ field }) => (
            <FormItem className='flex w-full flex-col gap-3'>
              <FormLabel className='text-white'>
                Content
              </FormLabel>
              <FormControl className='no-focus border border-dark-4 bg-dark-3 text-light-1 focus:border-primary-500'>
                <Textarea rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />       
    
    </div>

        <div className="flex gap-4 justify-start">
      <Button type='submit' className="bg-primary-500 hover:bg-cyan-400 hover:text-black">
      {!loading? <p>Edit Comment</p> : 
            <Image 
            src={"/assets/postloader.svg"}
            alt="loading animation for editing post"
            width = {44}
            height ={34}
            />}
      </Button>
      <Button type="button" className="bg-primary-500 hover:bg-cyan-400 hover:text-black" onClick={handleDelete}>
      {!deleting? <p>Delete Comment</p> : 
            <Image 
            src={"/assets/postloader.svg"}
            alt="loading animation for deleting post"
            width = {44}
            height ={34}
            />}
      </Button>
    </div>
      </form>
    </Form>
  )
}

export default EditComment