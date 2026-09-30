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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";
import { PostValdiation } from "@/lib/validations/post"
import { createPost } from "@/lib/actions/post.actions"
import * as z from "zod";
import { usePathname, useRouter } from "next/navigation";
import { useState, ChangeEvent} from "react"
import Image from "next/image"
import { generateUniqueImageID, isBase64Image } from "@/lib/utils"
import { getImageData, postImage } from "@/lib/s3"
import LoadingBar from "../shared/LoadingBar"


interface Props{
    name: string,
    userId: string
}

const getBio = (name: string) => {
    switch (name) {
        case 'movie':
            return "Input a one sentence concept. Sparks will create and upload an fanastic title based on it! A synopsis that future studios will enjoy with a recommended cast! You can even add a movie poster!"
        case 'Regular':
            return "Create A Post"
        case 'artwork':
            return "Input a one sentence concept. Sparks will create and upload an amazing artwork based off that concept!"
        case 'book':
            return "Input a one sentence concept. Sparks will create and upload an idea for an amazing Novel! With a title and a synopsis that will inspire you and others to write a novel worthy of the New York Times! You can even inlcude an AI generated Book Cover!"
        case 'fashion':
          return 'Input a one sentence concept. Sparks will create and uplaod a fabulous fashion off it!'
        case 'photography':
          return 'Input a one sentence concept. Sparks will create and upload a stunning photo out of it!'
        case 'haikus':
          return 'Input a one sentence concept. Sparks will create and upload a Haikus poem based on the concept! A haiku is a traditional form of Japanese poetry.'
        case 'quote':
          return 'Input a one sentence concept. Sparks will find a quote that relates to it and upload it!'
        case 'joke':
          return 'Input a one sentence concept. Sparks will create and upload a joke that is relating to it!'
        case 'aphorisms':
          return 'Input a one sentence concept. Sparks will create and upload an Aphorism based of it! An aphorism is a statement that expresses a general truth or observation about life.'
        default:
            return "No Type Selected"
    }
}

const getTitle = (name:string) => {
    switch(name) {
        case 'movie':
            return "AI Movie Synopsis Generator"
        case 'artwork':
          return "AI Artwork Generator"
        case 'fashion':
          return "AI Fashion Generator"
        case 'photography':
          return "AI Photography Generator"
        case 'book':
          return "AI Novel Synopsis Generator"
        case 'haikus':
          return "AI Haikus Generator"
        case 'quote':
          return "AI Quote Generator"
        case 'joke':
          return "AI Jokes Generator"
        case 'aphorisms':
          return "AI Aphorisms Generator"
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
    case 'artwork':
      return 'Artwork Spark'
    case 'fashion':
      return 'Fashion Spark'
    case 'photography':
      return 'Photography Spark'
    case 'book':
      return 'Novel Spark'
    case 'haikus':
      return 'Haikus Spark'
    case 'quote':
      return 'Quote Spark'
    case 'joke':
      return 'Joke Spark'
    case 'aphorisms':
      return 'Aphorism Spark'
    default:
      return 'Regular'
  }
}

const getImageLabel = (name: string) => {
  switch(name) {
    case 'movie':
      return 'AI Movie Poster'
    case 'artwork':
      return 'artImage'
    case 'book':
      return 'AI Book Cover'
    case 'fashion':
      return 'fashionImage'
    case 'photography':
      return 'photoImage'
    default:
      return 'AI Image'
  }
}



async function blobToBase64(blob: any) {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

function extractTitle(inputString: string): string {
  const titleMatch = inputString.match(/Title:([\s\S]*?)(Synopsis:|$)/i);
  return titleMatch ? titleMatch[1].trim() : '';
}

const getBackgroundImage = (name : string) => {
    switch(name) {
      case 'Regular':
        return 'Regular'
      case 'movie':
        return '/assets/movie.jpg'
      case 'artwork':
        return '/assets/formart.jpg'
      case 'fashion':
        return '/assets/fashion.jpg'
      case 'photography':
        return '/assets/photo.jpg'
      case 'book':
        return '/assets/formbook.jpg'
      case 'haikus':
        return '/assets/haiku.jpg'
      case 'quote':
        return '/assets/quote.jpg'
      case 'joke':
        return '/assets/joke.jpg'
      case 'aphorisms':
        return '/assets/hero.jpg'
      default:
        return 'Regular'
    }
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
          prompt: "",
        },
      });   
    
    
       
const onSubmit = async (values: z.infer<typeof PostValdiation>) => {
    setLoading(true);
    
    // const prompt = values.content
    let submit = true;    
    let gallery = false;
    let aiPost = false;

    if(name === "artwork" || name === "fashion" || name === "photography")
    {
      gallery = true; 
    }

    try{
    //If it is not a regular post make a call to the API 
    if(name !== 'Regular')
    {
        //set marker so if its an AI generated post users will be directed to an edit page to make adjustments to their liking! 
        aiPost=true;
        setProgress(10)
        values.prompt = values.content
        //Make API Call to Chat Model (Turbo 3.5) to Generate Content
        const getResponse = await fetch(`/api/openAIChat?prompt=${values.content}&type=${name}`, 
        {
          method: 'GET'
        });
        if(getResponse.ok)
        {
          values.content =  await getResponse.text();
          setProgress(30)

          if(includeImg || gallery)
          {
         
          const title = extractTitle(values.content)
          
          const imgDesResponse = await fetch(`/api/openAIChat?prompt=${values.content}&type=${getImageLabel(name)}&title=${title}`, {
            method: 'GET'
          });

          if(imgDesResponse)
          {
            setProgress(50)
            //Extract title and Synopsis from result to use as a prompt for the image Gen
            const imgPrompt = await imgDesResponse.text()
            
            if(includeImg || gallery){
            //Make API Call to DALL-E model to Generate Image
            const imgResponse = await fetch(`/api/openAIImage?prompt=${imgPrompt}`, 
            {
              method: 'GET'
            })
            if(imgResponse)
            {
              //Get DAll-E Image Blob From Server 
              const blob = await imgResponse.blob();
              
              //Convert Blob to Base 64
              const base64: any = await blobToBase64(blob)
              

              //If base64 send image to s3 bucket and also test if you can retrieve it 
              setProgress(60)
              if(isBase64Image(base64)){
                const uniqueId = generateUniqueImageID();

                const data ={
                  image : base64,
                  name : `${userId}_postImg_${uniqueId}`
                }
                const imgRes = await postImage(data);
                const imgGetRes = await getImageData(imgRes);
                setProgress(80)
               if (imgRes && imgGetRes) {
                values.image = imgRes;
              }else{
                 submit = false;
                 setLoading(false);
                 alert("There was an error uploading/getting the image, please try again")
              }
              }else{
                submit = false;
                setLoading(false);
                alert("There was an error getting a correct Image from AI, Please Try Again: Prompt might have been against community guidelines, try a different one")
              }
            }
            else{
              submit = false;
              setLoading(false);
              alert(`There Was An Error with Image AI Generation, Please Try Again: Prompt might have been against community guidelines, try a different one`);
            }
          }
          setProgress(100);

          }
          else{
            submit = false;
            setLoading(false);
            alert("Error Generating Image Description")
          }


        }
        }else{
          submit = false;
          setLoading(false);
          alert('There Was an Error with the AI Chat API, Please Try Again');
        }
    }
    //if it is a regular post, check to see if an image is included and then create post
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
           setLoading(false);
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
        prompt: values.prompt
      });
      
      if(post)
      {
        if(aiPost)
        {

          router.push(`/post/edit/${post}`);
        }else{
          router.push("/");
        }
        
      }
    }else{
      setLoading(false);
      alert("An error occured and a post was not able to be created at this time")
    }
      setLoading(false);
  }catch(error){
    setLoading(false)
    alert(`Error occured while submitting Error: ${error}` )
    console.log(`An Error Occured in Submit Function: ${error}`)
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
      <Card className="border-primary-500 border-2 "  
      style={{
        backgroundImage: name !== "Regular" ? `url(${getBackgroundImage(name)})` : "none",
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
      >
          <CardHeader>
            <CardTitle className={`${name !== 'Regular' ? "mx-auto mb-4 white text-heading2-bold" : "mx-auto mb-4 blue_gradient text-heading2-bold " }`}>
              {getTitle(name)}
            </CardTitle>
            <CardDescription className={`${name !== 'Regular' ? "mt-4 p-4 text-center bg-black  rounded-xl mx-4 text-light-1" : "mt-4 text-center mx-4 text-body-bold text-black"} `}>
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
              <FormLabel className={`${name !== "Regular" ? 'text-light-1': 'text-black'}`}>
                Content
              </FormLabel>
              <FormControl className='no-focus border border-dark-4 bg-dark-3 text-light-1 focus:border-primary-500'>
                <Textarea rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className={`${name ==='artwork' || name === "fashion" || name === "photography" || name === "haikus" || name === "quote" || name === "joke" || name === "aphorisms" ? 'hidden' : 'flex row gap-2 mx-auto bg-black p-4 rounded-xl'}`}>
        <h2 className="text-base-semibold text-light-1">{name === 'Regular' ? 'Image' : getImageLabel(name)}</h2>
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