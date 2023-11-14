"use client"
import { Card, CardHeader, CardTitle, CardDescription , CardContent, CardFooter } from "../ui/card"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Switch } from "../ui/switch"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@/components/ui/form";
import { set, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";
import { PostValdiation } from "@/lib/validations/post"
import { createPost } from "@/lib/actions/post.actions"
import * as z from "zod";
import { usePathname, useRouter } from "next/navigation";
import { useState, ChangeEvent} from "react"
import Image from "next/image"
import { isBase64Image } from "@/lib/utils"
import { getImageData, postImage } from "@/lib/s3"
import { v4 as uuidv4 } from 'uuid';

interface Props{
    name: string,
    userId: string
}

const getBio = (name: string) => {
    switch (name) {
        case 'movie':
            return "Input a one sentence concept. Sparkify will create an fanastic title! A synopsis that future studios will enjoy! You can even add a movie poster and a cast!"
        case 'Regular':
            return "Create a post"
        default:
            return "No Type Selected"
    }
}

const getTitle = (name:string) => {
    switch(name) {
        case 'movie':
            return "AI Movie Synopsis Generator"
            
        default: 
            return name.toLocaleUpperCase()
    }
}

function generateUniqueImageID() {
  return uuidv4();
}


const AIForm = ({name, userId} : Props) => {

const [loading, setLoading] = useState(false);
const [img, setImg] = useState("/assets/AI.jpg");
const [includeImg, setIncludeImg ]= useState(false);
const [files, setFiles] = useState<File[]>([]);

const pathname = usePathname();
const router = useRouter();
 const form = useForm<z.infer<typeof PostValdiation>>({
        resolver: zodResolver(PostValdiation),
        defaultValues: {
          content: "",
          image: "",
          accountId: userId,
        },
      });   
    
const onSubmit = async (values: z.infer<typeof PostValdiation>) => {
    setLoading(true);
    const blob = values.image;
    const uniqueId = generateUniqueImageID();

    const data ={
      image : blob,
      name : `${userId}_postImg_${uniqueId}`
    }

    try{ 
      if(blob)
       {
        const hasImageChanged = isBase64Image(blob);
         if (hasImageChanged) 
         {
          const imgRes = await postImage(data);
          const imgGetRes = await getImageData(imgRes);
         if (imgRes && imgGetRes) {
          values.image = imgRes;
        }
     }
      } 
     else{
       values.image = ''
     }

        const post = await createPost({
          text: values.content,
          author: userId,
          path: pathname,
          image: values.image
        });
        
        if(post)
        {
          router.push("/");
        }

      }catch(error)
      {
        alert("Error Creating Post, Please Try Again")
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
            setImg(imageDataUrl);
          };
    
          fileReader.readAsDataURL(file);
          
        }
      };

  const handleSwitch = () => {
    setIncludeImg(!includeImg);
  }

  return (
    <div>
      <Card className="border-primary-500 border-2">
          <CardHeader>
            <CardTitle className="mx-auto mb-4 blue_gradient">{getTitle(name)}</CardTitle>
            <CardDescription className="text-black mx-auto text-base-semibold">
              {getBio(name)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
          <Form {...form}>
      <form
        className='mt-4 flex flex-col justify-start gap-10'
        onSubmit={form.handleSubmit(onSubmit)}
      >

        {/* Content */}
        <FormField
          control={form.control}
          name='content'
          render={({ field }) => (
            <FormItem className='flex w-full flex-col gap-3'>
              <FormLabel className='text-base-semibold text-black'>
                Content
              </FormLabel>
              <FormControl className='no-focus border border-dark-4 bg-dark-3 text-light-1 focus:border-primary-500'>
                <Textarea rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className={`${name==='Regular'? "flex row gap-2" : "hidden"}`}>
        <h2 className="text-base-semibold">Image</h2>
        <Switch 
          checked={includeImg}
          onCheckedChange={handleSwitch}
          />
        </div>
       
        {/* Image */}
        <FormField
          control={form.control}
          name='image'
          render={({ field }) => (
            <FormItem className={`${includeImg? 'flex items-center gap-2' : 'hidden' }`}>
              <FormLabel className='account-form_image-label cursor-pointer'>
                   <Image
                   //@ts-ignore
                   src={img}
                   alt='profile_icon'
                   width={96}
                   height={96}
                   priority
                   className='rounded-full object-contain cursor-pointer'
                 />
              </FormLabel>
              <FormControl className='flex-1 text-base-semibold text-black'>
                <Input
                  type='file'
                  accept='image/*'
                  placeholder='Add profile photo'
                  className='cursor-pointer border-black hover:border-primary-500 bg-transparent outline-none file:text-black '
                  onChange={(e) => handleImage(e, field.onChange)}
                />
              </FormControl>
            </FormItem>
          )}
        />
         <CardFooter>
            <Button type='submit' className="mx-auto hover:bg-primary-500">{!loading? <p>Generate Idea</p> : 
            <Image 
            src={"/assets/postloader.svg"}
            alt="loading animation for creating post"
            width = {44}
            height ={34}
            />}
            </Button>
          </CardFooter>
          </form>
            </Form>
          </CardContent>
        </Card>
    </div> 
  )
}

export default AIForm