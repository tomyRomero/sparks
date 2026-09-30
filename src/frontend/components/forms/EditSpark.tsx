import React, { ChangeEvent, useEffect, useState } from 'react'
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
import { getImageData, postImage } from '@/lib/s3';
import Image from 'next/image';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { generateUniqueImageID, isBase64Image } from '@/lib/utils';
import { deletePost, updatePost } from '@/lib/actions/post.actions';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from '../ui/use-toast';

const EditSpark = (
  {
  postId, 
  contentImage, 
  content, 
  userId, 
  isComment, 
  parentId,
  title
}: 
  {
  postId: string, 
  contentImage: string, 
  content: string, 
  userId: string, 
  isComment: boolean, 
  parentId: string, 
  title: string
  }
  ) => {

    const [includeImg, setIncludeImg ]= useState(contentImage.length > 0 ? true : false);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false)
    const [files, setFiles] = useState<File[]>([]);
    const [contentImg, setContentImg] = useState('/assets/postloader.svg')

    const path = usePathname();
    const router = useRouter();

    function extractTitle(inputString: string): string {
        const titleMatch = inputString.match(/Title:([\s\S]*?)(Synopsis:|$)/i);
        return titleMatch ? titleMatch[1].trim() : '';
      }
      
      function extractSynopsis(inputString: string): string {
        const synopsisMatch = inputString.match(/(?:I'm|Synopsis:)([\s\S]*)/i);
        return synopsisMatch ? synopsisMatch[1].trim() : '';
      }

    const EditRegularValdiation = z.object({
        title: z.string().min(3,{message: 'Minimum 3 characters'} ),
        content: z.string().min(5, {message: 'Minimum 5 characters'}),
        accountId: z.string(),
        image: z.string(),
    })

    const form = useForm<z.infer<typeof EditRegularValdiation>>({
        resolver: zodResolver(EditRegularValdiation),
        defaultValues: {
          title: extractTitle(content),
          content: extractSynopsis(content),
          image: contentImage,
          accountId: userId,
        },
      });   

      useEffect(() => {
        const loadContentImage = async () => {
          try {
            let contentResult = '/assets/failed.svg';
            //@ts-ignore
            if (contentImage?.length > 0 && contentImage?.startsWith('user')) {
  
              const content = await getImageData(contentImage);
              contentResult = content ? content : '/assets/failed.svg';
            }else{
              //@ts-ignore
              if(contentImage?.length > 0)
              {
                //@ts-ignore
                contentResult = contentImage
              }
            }
      
            setContentImg(contentResult);
          } catch (error) {
            console.log("Error Getting Content Image:", error);
            setContentImg('/assets/failed.svg');
          }
        };
      
        loadContentImage()
      }, []);
      

      const handleSwitch = () => {
        setIncludeImg(!includeImg);
      }

             
const onSubmit = async (values: z.infer<typeof EditRegularValdiation>) => {
    setLoading(true);
  
    try{
    if(includeImg)
    {
      const blob = values.image;
      const hasImageChanged = isBase64Image(blob);
    
      if(hasImageChanged)
      {
        const uniqueId = generateUniqueImageID();
        const data ={
          image : blob,
          name : `${userId}_postImg_${uniqueId}`
        }
        const imgRes = await postImage(data);
        const imgGetRes = await getImageData(imgRes);
        if (imgRes && imgGetRes) {
        values.image = imgRes;
        }else{
          toast({
            title: "Failed",
            description: `Unable to upload or access image from the cloud`, 
            variant: "destructive",
          })
          setLoading(false)
          return;
        }
      }
  }else{
    values.image = '';
  }

  const updated = await updatePost(
    {
      postId, 
      text: `Title: ${values.title} synopsis:${values.content}`,
      image: values.image, 
      path
    })

    if(updated)
    {

      toast({
        title: "Success!",
        description: `Post Updated!`, 
      })

      setTimeout(() => {
        router.push(`/post/${postId}`)
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

const handleImage = (
    e: ChangeEvent<HTMLInputElement>,
    fieldChange: (value: string) => void
  ) => {
    e.preventDefault();

    const fileReader = new FileReader();

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFiles(Array.from(e.target.files));

      if (!file.type.includes("image")) return;

      fileReader.onload = async (event) => {
        const imageDataUrl = event.target?.result?.toString() || "";
        fieldChange(imageDataUrl);
        setContentImg(imageDataUrl);
      };

      fileReader.readAsDataURL(file);
      
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

       router.push(`/`)
       
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
        {/*Title */}
        <FormField
          control={form.control}
          name='title'
          render={({ field }) => (
            <FormItem className='flex w-full flex-col gap-3'>
              <FormLabel className='text-white'>
                Title
              </FormLabel>
              <FormControl className='no-focus border border-dark-4 bg-dark-3 text-light-1 focus:border-primary-500'>
                <Input
                    type='text'
                    className='account-form_input no-focus'
                    {...field}
                    />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
               {/* Content */}
            <FormField
          control={form.control}
          name='content'
          render={({ field }) => (
            <FormItem className={`flex w-full flex-col gap-3 ${title === "Fashion Spark" || title === "Photography Spark" || title === "Artwork Spark" ? "hidden" : ""}`}>
              <FormLabel className='text-white'>
                Content
              </FormLabel>
              <FormControl className='no-focus border border-dark-4 bg-dark-3 text-light-1 focus:border-primary-500'>
                <Textarea rows={6} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
            <div className="flex gap-2 pt-4">
            <h2 className=" text-light-1">Image:</h2>
            <div className={`${title === "Fashion Spark" || title === "Photography Spark" || title === "Artwork Spark" ? "hidden" : ""}`}>
              <Switch 
            checked={includeImg}
            onCheckedChange={handleSwitch}
            />
            </div>
        </div>

        <div className={`${includeImg ? "pt-4" : "hidden"}`}>
            <FormField
          control={form.control}
          name='image'
          render={({ field }) => (
            <FormItem className='flex items-center gap-2 pt-2'>
              <FormLabel className='account-form_image-label'>
                {field.value &&
                   <Image
                   //@ts-ignore
                   src={contentImg}
                   alt='content image'
                   width={96}
                   height={96}
                   priority
                   className='rounded-full object-contain'
                 />
                }
              </FormLabel>
              <FormControl className='flex-1 text-base-semibold text-gray-200'>
                <Input
                  type='file'
                  accept='image/*'
                  placeholder='Add/Edit Image on Post'
                  className='edit-form_image-input'
                  onChange={(e) => handleImage(e, field.onChange)}
                />
              </FormControl>
            </FormItem>
          )}
        />
        </div>
    
    </div>

        <div className="flex gap-4 justify-start">
      <Button type='submit' className="bg-primary-500 hover:bg-cyan-400 hover:text-black">
      {!loading? <p>Edit Spark</p> : 
            <Image 
            src={"/assets/postloader.svg"}
            alt="loading animation for editing post"
            width = {44}
            height ={34}
            />}
      </Button>
      <Button type="button" className="bg-primary-500 hover:bg-cyan-400 hover:text-black" onClick={handleDelete}>
      {!deleting? <p>Delete Spark</p> : 
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

export default EditSpark

