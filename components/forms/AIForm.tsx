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
import LoadingBar from "../shared/LoadingBar"


interface Props{
    name: string,
    userId: string
}

const getBio = (name: string) => {
    switch (name) {
        case 'movie':
            return "Input a one sentence concept. Sparks will create an fanastic title based on it! A synopsis that future studios will enjoy with a recommended cast! You can even add a movie poster!"
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

const postTitle = (name:string) => {
  switch(name) {
    case 'Regular':
      return 'Regular'
    case 'movie':
      return 'Movie Spark'
    default:
      return 'Regular'
  }
}

const getImageLabel = (name: string) => {
  switch(name) {
    case 'movie':
      return 'AI Movie Poster'
    default:
      return 'AI Image'
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
const [progress, setProgress] = useState(0);

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
    
    const prompt = values.content
    let submit = true;
    
    //If it is not a regular post make a call to the API
    if(name !== 'Regular')
    {
      
      setProgress(30)
       
        //Make API Call to Chat Model (Turbo 3.5) to Generate Content
        const getResponse = await fetch(`/api/openAIChat?prompt=${values.content}&type=${name}`, 
        {
          method: 'GET'
        });
        if(getResponse.ok)
        {
          setProgress(40)
          values.content =  await getResponse.json();
          setProgress(60)
          if(includeImg){
            //Make API Call to DALL-E model to Generate Image
            const imgResponse = await fetch(`/api/openAIImage?prompt=${prompt}&type=${name}`, 
            {
              method: 'GET'
            })

            if(imgResponse)
            {
              setProgress(70)
              values.image = await imgResponse.json();
              setProgress(80)
            }
            else{
              alert('There Was An Error with Image AI Generation, Please Try Again')
            }
          }
          setProgress(100);
        }else{
          submit = false;
          alert('There Was an Error with the AI Chat API, Please Try Again');
        }


    }//if it is a regular post, check to see if an image is included and then create post
    else
    {
    const blob = values.image;
    const uniqueId = generateUniqueImageID();

    const data ={
      image : blob,
      name : `${userId}_postImg_${uniqueId}`
    }
      if(blob)
       {
        const hasImageChanged = isBase64Image(blob);
         if (hasImageChanged) 
         {
          const imgRes = await postImage(data);
          const imgGetRes = await getImageData(imgRes);
         if (imgRes && imgGetRes) {
          values.image = imgRes;
        }else{
           submit = false;
           alert("There was an error uploading/getting the image, please try again")
        }
     }
    }
  }
    if(submit)
    {
      const post = await createPost({
        text: values.content,
        author: userId,
        path: pathname,
        image: values.image,
        title: postTitle(name),
      });
      
      if(post)
      {
        router.push("/");
      }
    }else{
      alert("An error occured and a post was not able to be created at this time")
    }
      setLoading(false);
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
            <CardDescription className="text-black text-center text-base-semibold">
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

        <div className={`${name==='artwork' || name === "fashion" || name === "photography" ? 'hidden' : 'flex row gap-2 mx-auto'}`}>
        <h2 className="text-base-semibold">{name === 'Regular' ? 'Image' : getImageLabel(name)}</h2>
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
            <FormItem className={`${includeImg && name === "Regular" ? 'flex items-center gap-2' : 'hidden' }`}>
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
            <Button type='submit' className="mx-auto hover:bg-primary-500">{!loading? <p>Generate Spark</p> : 
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
            {name !== 'Regular' && loading && <LoadingBar progress={progress} />}
          </CardContent>
        </Card>
    </div> 
  )
}

export default AIForm